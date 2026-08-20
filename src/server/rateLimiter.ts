import { Request, Response, NextFunction } from 'express';

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

    // Periodic sweep every 5 minutes to prevent memory leaks
    this.sweepInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
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

    // 1. In-flight concurrency lock (prevent overlapping hammering from the same client)
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

    // Determine limits based on tier
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

    // Filter timestamps within sustained window
    const sustainedCutoff = now - this.config.sustainedWindowMs;
    history.timestamps = history.timestamps.filter((ts) => ts > sustainedCutoff);

    // Filter timestamps within burst window
    const burstCutoff = now - this.config.burstWindowMs;
    const burstHits = history.timestamps.filter((ts) => ts > burstCutoff).length;

    // Check burst limit
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

    // Check sustained limit
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
