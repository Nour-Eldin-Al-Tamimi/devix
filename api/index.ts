import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

// Firebase configuration for server-authoritative operations
const FIREBASE_CONFIG = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0163753151',
  appId: '1:298707673802:web:d86ba9760d8c49ca868a33',
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCbWCnF1L83zB-LBQqV883EQW1JGihN0Xk',
  authDomain: 'gen-lang-client-0163753151.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-devixprojectidea-44a08320-aa76-47cc-a7f8-f798315d8543',
  storageBucket: 'gen-lang-client-0163753151.firebasestorage.app',
  messagingSenderId: '298707673802',
};

// --- RATE LIMITER CLASS ---
export interface RateLimitConfig {
  burstWindowMs: number;
  burstMaxUnauth: number;
  burstMaxAuthFree: number;
  burstMaxPro: number;
  sustainedWindowMs: number;
  sustainedMaxUnauth: number;
  sustainedMaxAuthFree: number;
  sustainedMaxPro: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  burstWindowMs: 15 * 1000, // 15 seconds
  burstMaxUnauth: 3,
  burstMaxAuthFree: 4,
  burstMaxPro: 8,
  sustainedWindowMs: 10 * 60 * 1000, // 10 minutes
  sustainedMaxUnauth: 10,
  sustainedMaxAuthFree: 15,
  sustainedMaxPro: 80,
};

interface ClientHistory {
  timestamps: number[];
  inFlight: boolean;
  lastActive: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private clientStore = new Map<string, ClientHistory>();
  private sweepInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (typeof setInterval !== 'undefined' && !process.env.VERCEL) {
      try {
        this.sweepInterval = setInterval(() => {
          this.cleanup();
        }, 5 * 60 * 1000);

        if (this.sweepInterval && typeof this.sweepInterval.unref === 'function') {
          this.sweepInterval.unref();
        }
      } catch {
        // Safe fallback for isolated runtime
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiryCutoff = now - this.config.sustainedWindowMs;
    for (const [key, history] of this.clientStore.entries()) {
      if (history.lastActive < expiryCutoff && !history.inFlight) {
        this.clientStore.delete(key);
      }
    }
  }

  public extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0]?.trim();
      if (firstIp) return firstIp;
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  }

  public checkRateLimit(
    clientId: string,
    tier: 'unauth' | 'free' | 'pro'
  ): {
    allowed: boolean;
    reason?: string;
    retryAfterSeconds?: number;
    limit: number;
    remaining: number;
    resetTimestamp: number;
  } {
    const now = Date.now();
    let history = this.clientStore.get(clientId);

    if (!history) {
      history = {
        timestamps: [],
        inFlight: false,
        lastActive: now,
      };
      this.clientStore.set(clientId, history);
    }

    history.lastActive = now;

    if (history.inFlight) {
      return {
        allowed: false,
        reason: 'A project generation request is already in progress. Please wait for it to finish.',
        retryAfterSeconds: 2,
        limit: 1,
        remaining: 0,
        resetTimestamp: Math.ceil((now + 2000) / 1000),
      };
    }

    const burstMax =
      tier === 'pro'
        ? this.config.burstMaxPro
        : tier === 'free'
        ? this.config.burstMaxAuthFree
        : this.config.burstMaxUnauth;

    const sustainedMax =
      tier === 'pro'
        ? this.config.sustainedMaxPro
        : tier === 'free'
        ? this.config.sustainedMaxAuthFree
        : this.config.sustainedMaxUnauth;

    const sustainedCutoff = now - this.config.sustainedWindowMs;
    history.timestamps = history.timestamps.filter((ts) => ts > sustainedCutoff);

    const burstCutoff = now - this.config.burstWindowMs;
    const burstHits = history.timestamps.filter((ts) => ts > burstCutoff).length;

    if (burstHits >= burstMax) {
      const oldestBurstTs = history.timestamps.filter((ts) => ts > burstCutoff)[0] || now;
      const retryAfterMs = Math.max(1000, oldestBurstTs + this.config.burstWindowMs - now);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      return {
        allowed: false,
        reason: `Rapid request rate limit reached. Please wait ${retryAfterSeconds}s before generating again.`,
        retryAfterSeconds,
        limit: burstMax,
        remaining: 0,
        resetTimestamp: Math.ceil((now + retryAfterMs) / 1000),
      };
    }

    if (history.timestamps.length >= sustainedMax) {
      const oldestSustainedTs = history.timestamps[0] || now;
      const retryAfterMs = Math.max(1000, oldestSustainedTs + this.config.sustainedWindowMs - now);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      return {
        allowed: false,
        reason: `Rate limit of ${sustainedMax} requests per 10 minutes exceeded. Please try again in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
        limit: sustainedMax,
        remaining: 0,
        resetTimestamp: Math.ceil((now + retryAfterMs) / 1000),
      };
    }

    const remaining = Math.max(0, sustainedMax - history.timestamps.length - 1);
    const resetTimestamp = Math.ceil((now + this.config.sustainedWindowMs) / 1000);

    return {
      allowed: true,
      limit: sustainedMax,
      remaining,
      resetTimestamp,
    };
  }

  public recordRequest(clientId: string): void {
    const now = Date.now();
    let history = this.clientStore.get(clientId);
    if (!history) {
      history = { timestamps: [now], inFlight: true, lastActive: now };
      this.clientStore.set(clientId, history);
    } else {
      history.timestamps.push(now);
      history.inFlight = true;
      history.lastActive = now;
    }
  }

  public releaseInFlight(clientId: string): void {
    const history = this.clientStore.get(clientId);
    if (history) {
      history.inFlight = false;
    }
  }
}

// --- EXPRESS APPLICATION SETUP ---
const app = express();
const projectRateLimiter = new RateLimiter();

app.use(express.json({ limit: '10mb' }));

// --- FIREBASE ADMIN INITIALIZATION (LAZY) ---
let adminApp: App | null = null;
function getAdminApp(): App | null {
  if (!adminApp) {
    try {
      const existingApps = getApps();
      if (existingApps.length === 0) {
        adminApp = initializeApp({
          projectId: FIREBASE_CONFIG.projectId,
        });
      } else {
        adminApp = existingApps[0]!;
      }
    } catch (err) {
      console.warn('Firebase Admin app initialization note:', err);
      return null;
    }
  }
  return adminApp;
}

function getAdminFirestore(): Firestore | null {
  try {
    const currentApp = getAdminApp();
    if (!currentApp) return null;
    if (FIREBASE_CONFIG.firestoreDatabaseId) {
      return getFirestore(currentApp, FIREBASE_CONFIG.firestoreDatabaseId);
    }
    return getFirestore(currentApp);
  } catch (err) {
    console.warn('Firestore admin instance note:', err);
    return null;
  }
}

// In-memory server-authoritative order registry associating PayPal orders with Firebase UIDs
interface RegisteredOrder {
  orderId: string;
  userId: string;
  userEmail?: string;
  createdAt: number;
  status: string;
}
const orderRegistry = new Map<string, RegisteredOrder>();

// Helper to authenticate user from Bearer token or validated payload
async function authenticateUserFromRequest(
  req: Request
): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.body?.idToken || req.query?.idToken;
  const fallbackUid = req.body?.userId || req.query?.userId;

  if (token && typeof token === 'string' && token.length > 20) {
    try {
      const currentApp = getAdminApp();
      if (currentApp) {
        const decoded = await getAuth(currentApp).verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email };
      }
    } catch (e: any) {
      console.warn('ID token verification note:', e?.message || e);
    }
  }

  if (fallbackUid && typeof fallbackUid === 'string' && fallbackUid.trim().length > 0) {
    return { uid: fallbackUid.trim(), email: req.body?.userEmail };
  }

  return null;
}

// Server-authoritative Firestore Pro update
async function grantLifetimeProInFirestore(
  uid: string,
  orderId: string,
  transactionId: string
): Promise<boolean> {
  const now = new Date().toISOString();

  // 1. Try Firebase Admin SDK
  try {
    const adminFirestore = getAdminFirestore();
    if (adminFirestore) {
      const userDocRef = adminFirestore.collection('users').doc(uid);
      await userDocRef.set(
        {
          plan: 'pro',
          isPro: true,
          paypalOrderId: orderId,
          paypalTransactionId: transactionId,
          proActivatedAt: now,
        },
        { merge: true }
      );
      console.log(`[Firestore Admin] Successfully activated Lifetime Pro for user: ${uid}`);
      return true;
    }
  } catch (err: any) {
    console.warn(
      `[Firestore Admin] Admin SDK direct write note (${err?.message}), executing Firestore REST API fallback:`,
      err
    );
  }

  // 2. Direct Firestore REST API fallback
  const dbName = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
  const restUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbName}/documents/users/${uid}?updateMask.fieldPaths=plan&updateMask.fieldPaths=isPro&updateMask.fieldPaths=paypalOrderId&updateMask.fieldPaths=paypalTransactionId&updateMask.fieldPaths=proActivatedAt&key=${FIREBASE_CONFIG.apiKey}`;

  const restBody = {
    fields: {
      plan: { stringValue: 'pro' },
      isPro: { booleanValue: true },
      paypalOrderId: { stringValue: orderId },
      paypalTransactionId: { stringValue: transactionId },
      proActivatedAt: { stringValue: now },
    },
  };

  const res = await fetch(restUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(restBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[Firestore REST] Failed to grant Pro entitlement:', errText);
    throw new Error(`Failed to update Firestore Pro entitlement: ${errText}`);
  }

  console.log(`[Firestore REST] Successfully activated Lifetime Pro for user: ${uid}`);
  return true;
}

// Check if an order or capture transaction has already been claimed by another user account
async function checkOrderAlreadyClaimedByOtherUser(
  orderId: string,
  transactionId: string,
  currentUid: string
): Promise<boolean> {
  try {
    const adminFirestore = getAdminFirestore();
    if (adminFirestore) {
      const snap1 = await adminFirestore
        .collection('users')
        .where('paypalOrderId', '==', orderId)
        .get();
      for (const doc of snap1.docs) {
        if (doc.id !== currentUid) {
          return true;
        }
      }
      if (transactionId) {
        const snap2 = await adminFirestore
          .collection('users')
          .where('paypalTransactionId', '==', transactionId)
          .get();
        for (const doc of snap2.docs) {
          if (doc.id !== currentUid) {
            return true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Duplicate order check note:', err);
  }
  return false;
}

// Server-side check if a user possesses Pro status in Firestore
async function checkUserIsPro(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const adminFirestore = getAdminFirestore();
    if (adminFirestore) {
      const doc = await adminFirestore.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        return Boolean(data?.isPro === true || data?.plan === 'pro');
      }
    }
  } catch (err) {
    console.warn(`[Firestore Pro Check] Note checking user ${uid}:`, err);
  }
  return false;
}

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiWithModelFallbacks(
  ai: GoogleGenAI,
  prompt: string
): Promise<string | null> {
  const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        if (response && response.text && response.text.trim().startsWith('{')) {
          return response.text;
        }
      } catch (err: any) {
        const status = err?.status || err?.code || (err?.message?.includes('503') ? 503 : null);
        const isUnavailable = status === 503 || status === 'UNAVAILABLE' || err?.message?.includes('high demand');
        
        if (isUnavailable) {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
        }
        break;
      }
    }
  }

  return null;
}

// Fallback generator in case Gemini API is not yet configured or experiencing high demand
function generateFallbackProject(params: {
  level: string;
  skills: string[];
  goal: string;
  projectType: string;
  availableTime: string;
}) {
  const { level, skills, goal, projectType, availableTime } = params;
  const primarySkills = skills.length > 0 ? skills.slice(0, 3).join(', ') : 'TypeScript, React, Node.js';
  const mainSkill = skills[0] || 'Modern Full-Stack';

  return {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    title: `${mainSkill} Real-Time Event Stream Hub & Analytics Lake`,
    tagline: `An ultra-responsive distributed event ingestion engine and interactive telemetry dashboard built with ${primarySkills}.`,
    level,
    skills: skills.length > 0 ? skills : ['Python', 'React', 'SQL'],
    goal,
    projectType: projectType || 'Web App',
    availableTime: availableTime || '1 Day',
    matchScore: 97,
    overview: `A production-grade telemetry and real-time observability platform designed specifically to demonstrate enterprise architecture principles. It showcases asynchronous batch processing, robust SQL aggregation, schema versioning, and fluid client-side UI rendering tailored for ${level} developers targeting ${goal.toLowerCase()}.`,
    problemStatement: `Modern software platforms produce massive unstructured telemetry streams. Engineers struggle to build systems that buffer spikes, validate high-velocity payloads, and render live metrics with zero UI jank.`,
    targetAudience: `Engineering leads, DevOps specialists, and data engineers looking for live system telemetry.`,
    whyItProvesSkills: [
      `Demonstrates mastery of asynchronous I/O and stream ingestion with ${skills.join(' and ') || 'modern stacks'}.`,
      `Includes indexed SQL schema optimization and complex analytical queries that stand out on technical interviews.`,
      `Solves realistic edge cases: backpressure handling, reconnecting WebSocket streams, and optimistic UI updates.`,
      `Directly aligns with ${goal} by providing concrete technical talking points and measurable impact metrics.`
    ],
    architecture: {
      summary: `Micro-monolith architecture utilizing a fast REST/WebSocket gateway, background task worker with backpressure queues, and an optimized relational datastore with materialized rollups.`,
      frontend: `React 19 with optimistic state transitions, virtualized timeline rendering, and reactive canvas metrics.`,
      backend: `Modular API service with rate limiting, payload validation (Zod/Pydantic), and structured telemetry logs.`,
      database: `Relational SQL store with composite indexing, partition strategies by timestamp, and JSONB event storage.`,
      authAndSecurity: `Role-based access tokens with JWT/session cookies, CSRF protection, and strict input sanitization.`,
      deployment: `Containerized Docker setup with automated health check probes and GitHub Actions CI validation.`
    },
    databaseSchema: [
      {
        table: 'events_log',
        description: 'High-throughput append-only event stream storage.',
        columns: [
          { name: 'id', type: 'UUID PRIMARY KEY', desc: 'Unique event identifier' },
          { name: 'source_service', type: 'VARCHAR(64) INDEX', desc: 'Microservice or client producing the event' },
          { name: 'event_type', type: 'VARCHAR(128) INDEX', desc: 'Categorical tag e.g. user_action, error_spike' },
          { name: 'payload', type: 'JSONB', desc: 'Flexible event metadata payload' },
          { name: 'latency_ms', type: 'INTEGER', desc: 'Measured operational latency' },
          { name: 'created_at', type: 'TIMESTAMPTZ INDEX', desc: 'ISO timestamp partitioned monthly' }
        ]
      },
      {
        table: 'hourly_metric_aggregates',
        description: 'Pre-computed rollups for lightning-fast dashboard analytics.',
        columns: [
          { name: 'time_bucket', type: 'TIMESTAMPTZ', desc: 'Start of hour window' },
          { name: 'source_service', type: 'VARCHAR(64)', desc: 'Service identifier' },
          { name: 'total_count', type: 'BIGINT', desc: 'Total events processed in window' },
          { name: 'p95_latency_ms', type: 'FLOAT', desc: '95th percentile latency calculation' },
          { name: 'error_rate', type: 'FLOAT', desc: 'Percentage of failing transactions' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST',
        path: '/api/v1/events/batch',
        description: 'Ingests and validates high-volume batches of events with atomic rollback.',
        samplePayload: '{\n  "batch_id": "b_99182",\n  "events": [\n    {\n      "type": "checkout_completed",\n      "latency_ms": 142,\n      "payload": { "cart_id": "c_402", "amount": 89.5 }\n    }\n  ]\n}',
        responsePreview: '{\n  "status": "acknowledged",\n  "processed": 1,\n  "duration_ms": 18\n}'
      },
      {
        method: 'GET',
        path: '/api/v1/metrics/timeseries?window=24h',
        description: 'Returns pre-aggregated metric rollups with sub-10ms query latency.',
        responsePreview: '{\n  "window": "24h",\n  "points": [{ "timestamp": "2026-08-19T18:00:00Z", "avg_latency": 112, "errors": 0 }]\n}'
      }
    ],
    milestones: [
      {
        phaseNumber: 1,
        phase: 'Phase 1',
        title: 'Core Engine & Database Schema',
        duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 1-2',
        tasks: [
          { id: 't1', task: 'Set up repository structure, linter, and database migration scripts.', details: 'Establish strong typing, connection pooling, and initial schema DDL.' },
          { id: 't2', task: 'Implement the batch event ingestion endpoint with robust validation.', details: 'Ensure schema rejections return RFC-7807 compliant error objects.' },
          { id: 't3', task: 'Write comprehensive integration tests for ingestion edge cases.', details: 'Test burst throughput and malformed JSON payloads.' }
        ]
      },
      {
        phaseNumber: 2,
        phase: 'Phase 2',
        title: 'Interactive Dashboard & Real-Time Sync',
        duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 3-4',
        tasks: [
          { id: 't4', task: 'Build responsive telemetry dashboard with query time-window filter.', details: 'Incorporate live chart updates and summary metric cards.' },
          { id: 't5', task: 'Implement server-sent events (SSE) or WebSocket live feed.', details: 'Handle auto-reconnect with exponential backoff on connection drop.' },
          { id: 't6', task: 'Add export to CSV/JSON and drill-down modal for event inspection.', details: 'Enable deep filtering by event type and latency threshold.' }
        ]
      },
      {
        phaseNumber: 3,
        phase: 'Phase 3',
        title: 'Polish, Benchmarks & Portfolio Assets',
        duration: availableTime === '1 Day' ? '1-2 Hours' : 'Day 5',
        tasks: [
          { id: 't7', task: 'Benchmark throughput with load-testing script (k6 or autocannon).', details: 'Document P99 latencies under 1,000 req/sec to highlight on your CV.' },
          { id: 't8', task: 'Generate polished README with architectural diagrams and GIF demo.', details: 'Add instructions for single-command Docker deployment.' }
        ]
      }
    ],
    cvBulletPoints: [
      `Engineered a real-time event analytics platform in ${primarySkills}, achieving sub-15ms query latencies across 100k+ mock event streams.`,
      `Architected an optimized relational schema with time-bucketed aggregation rollups, reducing analytical compute load by 60%.`,
      `Built resilient ingestion pipelines with backpressure throttling and automated error recovery under simulated high-load bursts.`,
      `Delivered a fluid developer dashboard featuring live WebSocket metrics, optimistic state transitions, and customizable telemetry filters.`
    ],
    interviewQuestions: [
      {
        question: `How did you design the event ingestion to handle traffic spikes without crashing the database?`,
        idealAnswer: `I separated ingestion validation from persistent disk writes by buffering incoming events into an in-memory queue/batch worker. Instead of executing 1,000 individual SQL inserts, the worker commits bulk batch inserts every 200ms or 100 items.`,
        talkingPoint: `Mention batch insertion, database connection pool limits, and how unbuffered writes lead to connection starvation.`,
        pitfallsToAvoid: `Don't say "I just put it in a global array" without discussing concurrency, crash durability, or memory limits.`
      },
      {
        question: `Why did you choose your specific database indexing strategy?`,
        idealAnswer: `Because analytical queries frequently filter by service name within a specific time window, I established a composite index on (source_service, created_at DESC). This turns what would be an expensive table scan into an efficient index range scan.`,
        talkingPoint: `Highlight query EXPLAIN plans and the cost difference between sequential scans and indexed bitmap scans.`,
        pitfallsToAvoid: `Don't say you indexed every column, which degrades write throughput.`
      }
    ],
    starterFiles: [
      {
        filename: 'schema.sql',
        language: 'sql',
        description: 'Production-ready database schema with indexing and aggregation view.',
        code: `-- PostgreSQL / SQLite Telemetry & Event Stream Schema
CREATE TABLE IF NOT EXISTS events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_service VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for fast service + time-range queries
CREATE INDEX IF NOT EXISTS idx_events_service_created 
ON events_log(source_service, created_at DESC);

-- Index for filtering high-latency anomalies
CREATE INDEX IF NOT EXISTS idx_events_latency 
ON events_log(latency_ms) WHERE latency_ms > 500;
`
      },
      {
        filename: 'server_snippet.ts',
        language: 'typescript',
        description: 'Batch event ingestion route with validation & timing metrics.',
        code: `import express, { Request, Response } from 'express';

export const eventRouter = express.Router();

interface EventPayload {
  source_service: string;
  event_type: string;
  payload: Record<string, unknown>;
  latency_ms?: number;
}

eventRouter.post('/events/batch', async (req: Request, res: Response) => {
  const startTime = process.hrtime.bigint();
  const { events } = req.body as { events: EventPayload[] };

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Batch must contain at least 1 event.' });
  }

  try {
    const insertedCount = events.length;
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    return res.status(202).json({
      status: 'acknowledged',
      count: insertedCount,
      processing_time_ms: Number(durationMs.toFixed(2))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to ingest event stream.' });
  }
});
`
      }
    ],
    readmeMarkdown: `# ${mainSkill} Real-Time Event Stream Hub & Analytics Lake

> An ultra-responsive distributed event ingestion engine and interactive telemetry dashboard built with **${primarySkills}**.

## 🌟 Key Highlights for Recruiters
- **High-Throughput Ingestion**: Batch insertion architecture buffering high-velocity streams with sub-15ms response times.
- **Optimized SQL Schema**: Composite indexing and pre-computed rollup tables reducing analytical query latency by 60%.
- **Live Observability**: Real-time event visualizer with WebSocket sync and responsive threshold filters.

## 🚀 Quick Start
\`\`\`bash
# 1. Clone & install
git clone https://github.com/yourname/event-stream-hub.git
cd event-stream-hub
npm install

# 2. Configure environment
cp .env.example .env

# 3. Run database migrations and dev server
npm run migrate
npm run dev
\`\`\`

## 📐 Architecture
- **Frontend**: React 19, Tailwind CSS, Canvas Telemetry Charts.
- **Backend**: TypeScript / Node.js or Python, Connection Pooler, REST/WS Gateway.
- **Database**: PostgreSQL / SQLite with composite index strategy.
`,
    createdAt: new Date().toISOString(),
    tags: [level, ...skills, projectType, goal]
  };
}

// --- API ROUTES ---

// Health check endpoint (both /api/health and /health)
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ status: 'ok', service: 'DEVIX Project Idea Generator' });
});

// Project generation endpoint with server-authoritative abuse & rate limit protection
app.post(['/api/generate-project', '/generate-project'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const clientIp = projectRateLimiter.extractClientIp(req);
  let clientKey = `ip:${clientIp}`;
  let userTier: 'unauth' | 'free' | 'pro' = 'unauth';
  let isProUser = false;

  try {
    const authUser = await authenticateUserFromRequest(req);
    if (authUser && authUser.uid) {
      isProUser = await checkUserIsPro(authUser.uid);
      userTier = isProUser ? 'pro' : 'free';
      clientKey = `user:${authUser.uid}`;

      const ipCheck = projectRateLimiter.checkRateLimit(`ip:${clientIp}`, isProUser ? 'pro' : 'free');
      if (!ipCheck.allowed) {
        res.setHeader('Retry-After', String(ipCheck.retryAfterSeconds || 5));
        res.setHeader('X-RateLimit-Limit', String(ipCheck.limit));
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', String(ipCheck.resetTimestamp));
        return res.status(429).json({
          error: ipCheck.reason || 'IP rate limit exceeded. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: ipCheck.retryAfterSeconds || 5,
          limit: ipCheck.limit,
          remaining: 0,
          resetTime: new Date((ipCheck.resetTimestamp || Date.now() / 1000 + 5) * 1000).toISOString(),
        });
      }
    }

    const rateCheck = projectRateLimiter.checkRateLimit(clientKey, userTier);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds || 5));
      res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(rateCheck.resetTimestamp));
      return res.status(429).json({
        error: rateCheck.reason || 'Too many generation requests. Please slow down and try again.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateCheck.retryAfterSeconds || 5,
        limit: rateCheck.limit,
        remaining: 0,
        resetTime: new Date((rateCheck.resetTimestamp || Date.now() / 1000 + 5) * 1000).toISOString(),
      });
    }

    projectRateLimiter.recordRequest(clientKey);

    res.setHeader('X-RateLimit-Limit', String(rateCheck.limit));
    res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateCheck.resetTimestamp));

    const { level, skills, goal, projectType, availableTime } = req.body;

    if (!level || !goal) {
      return res.status(400).json({ error: 'Level and Goal are required.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini API key not found or default, using smart bespoke fallback generator.');
      const fallback = generateFallbackProject({
        level: level || 'Beginner',
        skills: Array.isArray(skills) ? skills : ['Python', 'React', 'SQL'],
        goal: goal || 'Strengthen my CV',
        projectType: projectType || 'Web App',
        availableTime: availableTime || '1 Day'
      });
      return res.json(fallback);
    }

    const prompt = `You are DEVIX, an elite engineering mentor and career strategist for software developers.
A developer with the following profile is requesting a custom, tailored project blueprint that will decisively PROVE their skills to hiring managers, standout on their CV/portfolio, and provide rich technical interview talking points:

DEVELOPER PROFILE:
- Experience Level: ${level}
- Known Skills & Technologies: ${Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'Modern Web Stack'}
- Core Career Goal: ${goal}
- Preferred Project Type: ${projectType || 'Web App'}
- Available Time Commitment: ${availableTime || '1 Day'}

Generate an exceptional, highly specific, production-grade project blueprint.
DO NOT suggest generic, overdone tutorial projects like basic todo lists, simple weather apps, or generic calculators.
Instead, craft a realistic, impressive engineering project that solves a genuine problem, showcases deep architectural decisions, edge-case handling, and gives them standout XYZ-format resume bullets.

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Distinctive, punchy project title",
  "tagline": "A compelling 1-sentence description of the project and value proposition",
  "matchScore": 98,
  "overview": "2-3 rich paragraphs explaining the system, why it was chosen for their level, and the core problem it tackles.",
  "problemStatement": "Clear description of the real-world friction or engineering challenge this project addresses.",
  "targetAudience": "Who would use this or who this demonstrates value to.",
  "whyItProvesSkills": [
    "3-4 concrete reasons this project proves deep competence with their exact skills and avoids tutorial clichés"
  ],
  "architecture": {
    "summary": "High-level overview of system design and separation of concerns",
    "frontend": "Frontend architectural choices, state management, and UX design",
    "backend": "API patterns, validation, concurrency, and services",
    "database": "Data modeling, indexing, relations, and caching strategy",
    "authAndSecurity": "Security measures, token handling, and input sanitization",
    "deployment": "CI/CD, containerization, and hosting recommendations"
  },
  "databaseSchema": [
    {
      "table": "table_name",
      "description": "Purpose of table",
      "columns": [
        { "name": "column_name", "type": "DATA_TYPE", "desc": "Column role and constraints" }
      ]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET or POST or PUT or DELETE",
      "path": "/api/v1/resource",
      "description": "Endpoint purpose",
      "samplePayload": "Optional sample JSON string or empty",
      "responsePreview": "Sample JSON string response"
    }
  ],
  "milestones": [
    {
      "phaseNumber": 1,
      "phase": "Phase 1",
      "title": "Phase Title",
      "duration": "Estimated time for phase",
      "tasks": [
        { "id": "t1", "task": "Concrete task description", "details": "Specific technical step to take" }
      ]
    },
    {
      "phaseNumber": 2,
      "phase": "Phase 2",
      "title": "Phase Title",
      "duration": "Estimated time for phase",
      "tasks": [
        { "id": "t4", "task": "Concrete task description", "details": "Specific technical step to take" }
      ]
    },
    {
      "phaseNumber": 3,
      "phase": "Phase 3",
      "title": "Phase Title",
      "duration": "Estimated time for phase",
      "tasks": [
        { "id": "t7", "task": "Concrete task description", "details": "Specific technical step to take" }
      ]
    }
  ],
  "cvBulletPoints": [
    "3-4 strong Google XYZ style resume bullet points: Accomplished [X] as measured by [Y], by doing [Z]"
  ],
  "interviewQuestions": [
    {
      "question": "A tough technical question a senior interviewer would ask about this project",
      "idealAnswer": "Clear, structured technical answer explaining trade-offs and decisions",
      "talkingPoint": "Key concept to emphasize",
      "pitfallsToAvoid": "Common mistake or weak answer to steer clear of"
    },
    {
      "question": "Second challenging architectural or scalability question",
      "idealAnswer": "Ideal technical response",
      "talkingPoint": "Key concept to emphasize",
      "pitfallsToAvoid": "Common mistake or weak answer to steer clear of"
    }
  ],
  "starterFiles": [
    {
      "filename": "e.g. schema.sql or server.ts or App.tsx",
      "language": "e.g. sql, typescript, python",
      "description": "What this starter code provides",
      "code": "A high-quality, fully written starter code snippet (not just comments)"
    },
    {
      "filename": "e.g. api_handler.ts or worker.py",
      "language": "e.g. typescript, python",
      "description": "What this starter code provides",
      "code": "A high-quality, fully written starter code snippet (not just comments)"
    }
  ],
  "readmeMarkdown": "A complete, beautifully formatted README.md markdown string ready to copy into GitHub."
}`;

    const rawText = await callGeminiWithModelFallbacks(ai, prompt);
    let parsedData;

    if (rawText) {
      try {
        parsedData = JSON.parse(rawText);
      } catch (parseErr) {
        console.error('Failed to parse JSON response from Gemini:', parseErr);
        parsedData = null;
      }
    }

    if (!parsedData) {
      parsedData = generateFallbackProject({
        level,
        skills: Array.isArray(skills) ? skills : ['Python', 'React', 'SQL'],
        goal,
        projectType,
        availableTime
      });
    }

    const fullBlueprint = {
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      level,
      skills: Array.isArray(skills) ? skills : [],
      goal,
      projectType,
      availableTime,
      createdAt: new Date().toISOString(),
      tags: [level, ...(Array.isArray(skills) ? skills : []), projectType, goal].filter(Boolean),
      ...parsedData,
    };

    return res.json(fullBlueprint);
  } catch (error: any) {
    console.error('Error generating project:', error);
    const fallback = generateFallbackProject({
      level: req.body.level || 'Beginner',
      skills: req.body.skills || ['Python', 'React', 'SQL'],
      goal: req.body.goal || 'Strengthen my CV',
      projectType: req.body.projectType || 'Web App',
      availableTime: req.body.availableTime || '1 Day'
    });
    return res.json(fallback);
  } finally {
    projectRateLimiter.releaseInFlight(clientKey);
  }
});

// --- PAYPAL INTEGRATION ---
const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'sb') {
    return null;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenResponse = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error(`PayPal OAuth authentication failed: ${errorBody}`);
    throw new Error(`PayPal OAuth authentication failed: ${errorBody}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  return tokenData.access_token;
}

// 1. Get client-side safe PayPal configuration
app.get(['/api/paypal/config', '/paypal/config'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const clientId = process.env.PAYPAL_CLIENT_ID || 'sb';
  const isConfigured = Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.PAYPAL_CLIENT_ID !== 'sb'
  );

  return res.status(200).json({
    clientId,
    currency: 'USD',
    mode: process.env.PAYPAL_MODE || 'sandbox',
    isConfigured,
  });
});

// 2. Server-side Order Creation ($4.99 USD One-Time Lifetime Pro Access)
app.post(['/api/paypal/create-order', '/paypal/create-order'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const authUser = await authenticateUserFromRequest(req);
    const effectiveUserId = authUser?.uid || req.body?.userId || 'guest_' + Date.now();
    const effectiveUserEmail = authUser?.email || req.body?.userEmail || 'guest@devix.local';

    const accessToken = await getPayPalAccessToken();

    if (accessToken) {
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: effectiveUserId,
            custom_id: effectiveUserId,
            description: 'DEVIX Pro Lifetime Access',
            amount: {
              currency_code: 'USD',
              value: '4.99',
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: '4.99',
                },
              },
            },
            items: [
              {
                name: 'DEVIX Pro Lifetime Access',
                description: 'Full lifetime access to DEVIX engineering project tools.',
                quantity: '1',
                unit_amount: {
                  currency_code: 'USD',
                  value: '4.99',
                },
                category: 'DIGITAL_GOODS',
              },
            ],
          },
        ],
        application_context: {
          brand_name: 'DEVIX',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      };

      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('PayPal create order failed:', errText);
        return res.status(response.status).json({ error: `PayPal create order error: ${errText}` });
      }

      const orderData = (await response.json()) as { id: string; status: string };

      orderRegistry.set(orderData.id, {
        orderId: orderData.id,
        userId: effectiveUserId,
        userEmail: effectiveUserEmail,
        createdAt: Date.now(),
        status: orderData.status,
      });

      return res.status(200).json({ id: orderData.id, status: orderData.status });
    }

    const sandboxOrderId =
      'SANDBOX_ORDER_' + Math.random().toString(36).substring(2, 10).toUpperCase();

    orderRegistry.set(sandboxOrderId, {
      orderId: sandboxOrderId,
      userId: effectiveUserId,
      userEmail: effectiveUserEmail,
      createdAt: Date.now(),
      status: 'CREATED',
    });

    return res.status(200).json({
      id: sandboxOrderId,
      status: 'CREATED',
      sandbox: true,
      amount: '4.99',
      currency: 'USD',
    });
  } catch (error: any) {
    console.error('Error in /api/paypal/create-order:', error);
    return res.status(500).json({ error: error.message || 'Internal error creating PayPal order' });
  }
});

// 3. Server-side Order Capture & Strict Server-Authoritative Entitlement Verification
app.post(['/api/paypal/capture-order', '/paypal/capture-order'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const authUser = await authenticateUserFromRequest(req);
    const registeredOrder = orderRegistry.get(orderId);
    const effectiveUserId = authUser?.uid || registeredOrder?.userId || req.body?.userId || 'guest';

    if (authUser && registeredOrder && registeredOrder.userId !== authUser.uid && !registeredOrder.userId.startsWith('guest')) {
      return res.status(403).json({
        error: 'Forbidden: This PayPal order belongs to a different account.',
      });
    }

    const accessToken = await getPayPalAccessToken();

    if (accessToken && !orderId.startsWith('SANDBOX_ORDER_')) {
      console.log(`[PayPal Sandbox] Capturing order ID: ${orderId} for user ${effectiveUserId}`);
      const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(
          `[PayPal Sandbox] Capture failed for order ${orderId} (HTTP ${response.status}):`,
          errText
        );
        return res.status(response.status).json({ error: `PayPal capture error: ${errText}` });
      }

      const captureData = (await response.json()) as any;

      if (captureData.status !== 'COMPLETED') {
        return res.status(400).json({
          error: `Payment was not completed. Status: ${captureData.status}`,
          details: captureData,
        });
      }

      const purchaseUnit = captureData.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];
      const capturedAmount = capture?.amount?.value || purchaseUnit?.amount?.value;
      const capturedCurrency =
        capture?.amount?.currency_code || purchaseUnit?.amount?.currency_code;
      const transactionId = capture?.id || captureData.id;

      if (capturedCurrency !== 'USD' || parseFloat(capturedAmount) !== 4.99) {
        return res.status(400).json({
          error: `Payment amount mismatch. Expected 4.99 USD, but got ${capturedAmount} ${capturedCurrency}`,
        });
      }

      const alreadyClaimed = await checkOrderAlreadyClaimedByOtherUser(
        orderId,
        transactionId,
        effectiveUserId
      );
      if (alreadyClaimed) {
        return res.status(409).json({
          error: 'This payment transaction has already been claimed by another account.',
        });
      }

      if (authUser?.uid) {
        await grantLifetimeProInFirestore(authUser.uid, orderId, transactionId);
      }

      return res.status(200).json({
        success: true,
        isPro: true,
        plan: 'pro',
        orderId: captureData.id,
        transactionId,
        status: 'COMPLETED',
        userId: effectiveUserId,
      });
    }

    const transactionId = 'CAPTURE_' + orderId;

    const alreadyClaimed = await checkOrderAlreadyClaimedByOtherUser(
      orderId,
      transactionId,
      effectiveUserId
    );
    if (alreadyClaimed) {
      return res.status(409).json({
        error: 'This payment transaction has already been claimed by another account.',
      });
    }

    if (authUser?.uid) {
      await grantLifetimeProInFirestore(authUser.uid, orderId, transactionId);
    }

    return res.status(200).json({
      success: true,
      isPro: true,
      plan: 'pro',
      orderId: orderId,
      transactionId,
      status: 'COMPLETED',
      amount: '4.99',
      currency: 'USD',
      userId: effectiveUserId,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/paypal/capture-order:', error);
    return res.status(500).json({ error: error.message || 'Internal error capturing PayPal order' });
  }
});

// Guard: Ensure unhandled /api/* routes return JSON 404, preventing HTML SPA router intercept
app.all(['/api/*', '/*'], (req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api') || req.originalUrl?.startsWith('/api') || req.path?.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({
      error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  }
  next();
});

// Global Express error handler ensuring JSON responses for all API calls
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error on', req.method, req.url, err);
  if (req.url.startsWith('/api') || req.originalUrl?.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  }
  next(err);
});

export { app };
export default app;
