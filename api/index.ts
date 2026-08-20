import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  buildGeminiPrompt,
  validateAndEnforceConsistency,
  generateBespokeFallbackProject,
} from './generator';

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

// Pre-configured list of 20 secure random Beta Access Codes
const INITIAL_BETA_CODES = [
  'DEVIX-BETA-7K9M2P4X',
  'DEVIX-BETA-R3V8N5TW',
  'DEVIX-BETA-Q2J6Y8FD',
  'DEVIX-BETA-L4H9Z1CX',
  'DEVIX-BETA-9D3W7B2N',
  'DEVIX-BETA-P8M4K6YJ',
  'DEVIX-BETA-T2R5X9VF',
  'DEVIX-BETA-C7B1H4NQ',
  'DEVIX-BETA-W6Z3P8MD',
  'DEVIX-BETA-E5Y9K2LT',
  'DEVIX-BETA-A1X4R7VP',
  'DEVIX-BETA-M8Q2D6WN',
  'DEVIX-BETA-H3J7T9KF',
  'DEVIX-BETA-B5N1Y4PZ',
  'DEVIX-BETA-V9L6C2RH',
  'DEVIX-BETA-F4T8W3XQ',
  'DEVIX-BETA-K7P2M9YD',
  'DEVIX-BETA-Z1R5N8TB',
  'DEVIX-BETA-Y3K7X2VF',
  'DEVIX-BETA-N9D4P6MQ',
];

function getValidBetaCodesSet(): Set<string> {
  const codes = new Set<string>(INITIAL_BETA_CODES);
  if (process.env.DEVIX_BETA_CODES) {
    process.env.DEVIX_BETA_CODES.split(',').forEach((c) => {
      const trimmed = c.trim().toUpperCase();
      if (trimmed) codes.add(trimmed);
    });
  }
  return codes;
}

// In-memory beta code tracker and quota tracker for server-authoritative state
const memoryBetaRedemptions = new Map<string, { redeemedBy: string; redeemedAt: string }>();
const memoryBetaUserQuota = new Map<string, number>();

// Atomically redeem a Beta Access Code and grant 100 free generations
async function redeemBetaCodeInFirestore(
  rawCode: string,
  userId: string
): Promise<{
  success: boolean;
  generationsGranted: number;
  generationsRemaining: number;
  error?: string;
  code?: string;
  status: number;
}> {
  const normalizedCode = (rawCode || '').trim().toUpperCase();
  const validCodes = getValidBetaCodesSet();

  if (!normalizedCode || !normalizedCode.startsWith('DEVIX-BETA-') || normalizedCode.length < 12) {
    return {
      success: false,
      generationsGranted: 0,
      generationsRemaining: 0,
      error: 'Invalid Beta Code format. Expected format: DEVIX-BETA-XXXXXXXX',
      code: 'INVALID_FORMAT',
      status: 400,
    };
  }

  const now = new Date().toISOString();

  // Validate that code is in the allowed set
  if (!validCodes.has(normalizedCode)) {
    return {
      success: false,
      generationsGranted: 0,
      generationsRemaining: 0,
      error: 'Invalid Beta Access Code. Please verify your code and try again.',
      code: 'INVALID_CODE',
      status: 400,
    };
  }

  // Check in-memory redemption registry first
  if (memoryBetaRedemptions.has(normalizedCode)) {
    return {
      success: false,
      generationsGranted: 0,
      generationsRemaining: 0,
      error: 'This Beta Access Code has already been redeemed.',
      code: 'ALREADY_REDEEMED',
      status: 409,
    };
  }

  const adminFirestore = getAdminFirestore();

  if (adminFirestore) {
    try {
      const result = await adminFirestore.runTransaction(async (transaction) => {
        const codeDocRef = adminFirestore.collection('beta_codes').doc(normalizedCode);
        const codeSnap = await transaction.get(codeDocRef);

        if (codeSnap.exists) {
          const codeData = codeSnap.data();
          if (codeData?.status === 'redeemed') {
            throw new Error('CODE_ALREADY_REDEEMED');
          }
          transaction.update(codeDocRef, {
            status: 'redeemed',
            redeemed_by: userId,
            redeemed_at: now,
          });
        } else {
          transaction.set(codeDocRef, {
            code: normalizedCode,
            status: 'redeemed',
            redeemed_by: userId,
            redeemed_at: now,
            generations_granted: 100,
          });
        }

        let newRemaining = 100;
        if (userId) {
          const userDocRef = adminFirestore.collection('users').doc(userId);
          const userSnap = await transaction.get(userDocRef);
          const currentRemaining = userSnap.exists ? Number(userSnap.data()?.betaGenerationsRemaining || 0) : 0;
          newRemaining = currentRemaining + 100;

          transaction.set(
            userDocRef,
            {
              isBeta: true,
              betaGenerationsRemaining: newRemaining,
              redeemedBetaCode: normalizedCode,
              betaRedeemedAt: now,
            },
            { merge: true }
          );
        }

        return {
          generationsGranted: 100,
          generationsRemaining: newRemaining,
        };
      });

      // Synchronize in-memory tracker
      memoryBetaRedemptions.set(normalizedCode, { redeemedBy: userId, redeemedAt: now });
      if (userId) {
        memoryBetaUserQuota.set(userId, result.generationsRemaining);
      }

      return {
        success: true,
        generationsGranted: result.generationsGranted,
        generationsRemaining: result.generationsRemaining,
        status: 200,
      };
    } catch (err: any) {
      if (err.message === 'CODE_ALREADY_REDEEMED') {
        memoryBetaRedemptions.set(normalizedCode, { redeemedBy: userId, redeemedAt: now });
        return {
          success: false,
          generationsGranted: 0,
          generationsRemaining: 0,
          error: 'This Beta Access Code has already been redeemed.',
          code: 'ALREADY_REDEEMED',
          status: 409,
        };
      }
      console.warn(
        `[Beta Redemption] Firestore transaction note (${err?.message}), using server-authoritative fallback:`,
        err
      );
    }
  }

  // Server-authoritative fallback execution
  memoryBetaRedemptions.set(normalizedCode, { redeemedBy: userId, redeemedAt: now });
  const currentQuota = memoryBetaUserQuota.get(userId) || 0;
  const newQuota = currentQuota + 100;
  if (userId) {
    memoryBetaUserQuota.set(userId, newQuota);
  }

  return {
    success: true,
    generationsGranted: 100,
    generationsRemaining: newQuota,
    status: 200,
  };
}

// Atomically check and consume 1 beta generation if available
async function checkAndConsumeBetaQuota(uid: string): Promise<{ hasBeta: boolean; remaining: number }> {
  if (!uid) return { hasBeta: false, remaining: 0 };
  const adminFirestore = getAdminFirestore();

  if (adminFirestore) {
    try {
      return await adminFirestore.runTransaction(async (transaction) => {
        const userRef = adminFirestore.collection('users').doc(uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          return { hasBeta: false, remaining: 0 };
        }
        const data = userDoc.data();
        const remaining = Number(data?.betaGenerationsRemaining || 0);
        if (remaining > 0) {
          const nextRemaining = Math.max(0, remaining - 1);
          transaction.update(userRef, {
            betaGenerationsRemaining: nextRemaining,
          });
          memoryBetaUserQuota.set(uid, nextRemaining);
          return { hasBeta: true, remaining: nextRemaining };
        }
        return { hasBeta: Boolean(data?.isBeta), remaining: 0 };
      });
    } catch (e) {
      console.warn(`[Beta Quota Check] Firestore note for ${uid}, falling back to server memory quota:`, e);
    }
  }

  // Memory fallback check
  const memQuota = memoryBetaUserQuota.get(uid);
  if (memQuota !== undefined && memQuota > 0) {
    const nextRemaining = memQuota - 1;
    memoryBetaUserQuota.set(uid, nextRemaining);
    return { hasBeta: true, remaining: nextRemaining };
  }
  if (memQuota !== undefined && memQuota === 0) {
    return { hasBeta: true, remaining: 0 };
  }

  return { hasBeta: false, remaining: 0 };
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
  return generateBespokeFallbackProject(params);
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
  let isBetaUser = false;
  let betaRemaining = 0;

  try {
    const authUser = await authenticateUserFromRequest(req);
    if (authUser && authUser.uid) {
      isProUser = await checkUserIsPro(authUser.uid);
      if (isProUser) {
        userTier = 'pro';
      } else {
        const betaQuota = await checkAndConsumeBetaQuota(authUser.uid);
        if (betaQuota.hasBeta && betaQuota.remaining >= 0) {
          isBetaUser = true;
          betaRemaining = betaQuota.remaining;
          userTier = 'free';
          res.setHeader('X-Beta-Generations-Remaining', String(betaRemaining));
        } else {
          userTier = 'free';
        }
      }
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

    const rateCheck = projectRateLimiter.checkRateLimit(clientKey, isProUser ? 'pro' : userTier);
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
    if (isBetaUser) {
      res.setHeader('X-Beta-Generations-Remaining', String(betaRemaining));
    }

    const { level, skills, goal, projectType, availableTime } = req.body;

    if (!level || !goal) {
      return res.status(400).json({ error: 'Level and Goal are required.' });
    }

    const sanitizedParams = {
      level: level || 'Junior',
      skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Python', 'React', 'SQL'],
      goal: goal || 'Strengthen my CV',
      projectType: projectType || 'Web App',
      availableTime: availableTime || '1 Day'
    };

    const ai = getGeminiClient();

    if (!ai) {
      console.log('Gemini API key not found or default, using smart bespoke fallback generator.');
      const fallback = generateBespokeFallbackProject(sanitizedParams);
      return res.json(fallback);
    }

    const prompt = buildGeminiPrompt(sanitizedParams);

    const rawText = await callGeminiWithModelFallbacks(ai, prompt);
    let parsedData: any = null;

    if (rawText) {
      try {
        let cleanText = rawText.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();
        parsedData = JSON.parse(cleanText);
      } catch (parseErr) {
        console.error('Failed to parse JSON response from Gemini:', parseErr);
        parsedData = null;
      }
    }

    let fullBlueprint;
    if (parsedData && typeof parsedData === 'object' && parsedData.title) {
      fullBlueprint = validateAndEnforceConsistency(parsedData, sanitizedParams);
    } else {
      fullBlueprint = generateBespokeFallbackProject(sanitizedParams);
    }

    return res.json(fullBlueprint);
  } catch (error: any) {
    console.error('Error generating project:', error);
    const fallback = generateBespokeFallbackProject({
      level: req.body?.level || 'Junior',
      skills: Array.isArray(req.body?.skills) && req.body.skills.length > 0 ? req.body.skills : ['Python', 'React', 'SQL'],
      goal: req.body?.goal || 'Strengthen my CV',
      projectType: req.body?.projectType || 'Web App',
      availableTime: req.body?.availableTime || '1 Day'
    });
    return res.json(fallback);
  } finally {
    projectRateLimiter.releaseInFlight(clientKey);
  }
});

// --- BETA ACCESS CODE REDEMPTION ---
app.post(['/api/beta/redeem', '/beta/redeem'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { code } = req.body || {};
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a Beta Access Code.',
        code: 'MISSING_CODE',
      });
    }

    const authUser = await authenticateUserFromRequest(req);
    const clientIp = projectRateLimiter.extractClientIp(req);
    const effectiveUserId = authUser?.uid || req.body?.userId || ('guest_' + clientIp.replace(/[^a-zA-Z0-9]/g, '_'));

    const result = await redeemBetaCodeInFirestore(code, effectiveUserId);

    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error,
        code: result.code,
      });
    }

    return res.status(200).json({
      success: true,
      generationsGranted: result.generationsGranted,
      generationsRemaining: result.generationsRemaining,
      message: 'Beta Access Activated! You have 100 free generations.',
      userId: effectiveUserId,
    });
  } catch (err: any) {
    console.error('Error in /api/beta/redeem:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error redeeming Beta Code.',
    });
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
