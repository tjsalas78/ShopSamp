/**
 * Rate limiter service for managing API call rates per marketplace.
 * Implements token bucket algorithm with exponential backoff for rate limit errors.
 */

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

export interface RateLimitStatus {
  marketplace: string;
  allowedNow: boolean;
  nextAllowedAt?: Date;
  tokensRemaining: number;
  resetAt: Date;
  requestsInWindow: number;
  consecutiveErrors: number;
}

/**
 * Token bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond
  private lastRefillTime: number;
  private consecutiveErrors: number = 0;
  private lastErrorTime: number | null = null;
  private backoffMultiplier: number;
  private currentBackoffMs: number;
  private maxBackoffMs: number;

  constructor(
    maxTokens: number,
    refillRatePerMinute: number,
    backoffMultiplier: number = 2,
    maxBackoffMs: number = 300000 // 5 minutes
  ) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRatePerMinute / 60000; // Convert per-minute to per-ms
    this.lastRefillTime = Date.now();
    this.backoffMultiplier = backoffMultiplier;
    this.currentBackoffMs = 1000; // Start with 1 second
    this.maxBackoffMs = maxBackoffMs;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = elapsed * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }

  /**
   * Try to consume a token
   */
  consume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.consecutiveErrors = 0;
      return true;
    }

    return false;
  }

  /**
   * Get milliseconds until next token is available
   */
  getWaitTimeMs(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    // Calculate time needed to get 1 token
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  /**
   * Record an error (rate limit or other)
   */
  recordError(): void {
    this.consecutiveErrors++;
    this.lastErrorTime = Date.now();
  }

  /**
   * Get current backoff time (increases with consecutive errors)
   */
  getBackoffMs(): number {
    if (this.consecutiveErrors <= 0) {
      this.currentBackoffMs = 1000;
      return 0;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, ... up to maxBackoffMs
    const backoff = Math.min(
      1000 * Math.pow(this.backoffMultiplier, this.consecutiveErrors - 1),
      this.maxBackoffMs
    );

    return backoff;
  }

  /**
   * Get current state
   */
  getStatus(): {
    tokensRemaining: number;
    nextTokenAt: Date;
    consecutiveErrors: number;
    backoffMs: number;
  } {
    this.refill();

    return {
      tokensRemaining: Math.floor(this.tokens),
      nextTokenAt: new Date(Date.now() + this.getWaitTimeMs()),
      consecutiveErrors: this.consecutiveErrors,
      backoffMs: this.getBackoffMs(),
    };
  }
}

/**
 * Rate limiter - manages rate limits for multiple marketplaces
 */
export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register a marketplace with rate limit config
   */
  registerMarketplace(marketplace: string, config: RateLimitConfig): void {
    this.configs.set(marketplace, config);

    const bucket = new TokenBucket(
      config.requestsPerMinute,
      config.requestsPerMinute,
      config.backoffMultiplier || 2,
      config.maxBackoffMs || 300000
    );

    this.buckets.set(marketplace, bucket);
  }

  /**
   * Check if a request is allowed for a marketplace
   */
  isAllowed(marketplace: string): boolean {
    const bucket = this.buckets.get(marketplace);
    if (!bucket) {
      throw new Error(`Marketplace not registered: ${marketplace}`);
    }

    return bucket.consume();
  }

  /**
   * Get milliseconds to wait before next request
   */
  getWaitTimeMs(marketplace: string): number {
    const bucket = this.buckets.get(marketplace);
    if (!bucket) {
      throw new Error(`Marketplace not registered: ${marketplace}`);
    }

    return bucket.getWaitTimeMs();
  }

  /**
   * Record a rate limit error
   */
  recordRateLimitError(marketplace: string): number {
    const bucket = this.buckets.get(marketplace);
    if (!bucket) {
      throw new Error(`Marketplace not registered: ${marketplace}`);
    }

    bucket.recordError();
    return bucket.getBackoffMs();
  }

  /**
   * Get status for a marketplace
   */
  getStatus(marketplace: string): RateLimitStatus {
    const bucket = this.buckets.get(marketplace);
    if (!bucket) {
      throw new Error(`Marketplace not registered: ${marketplace}`);
    }

    const status = bucket.getStatus();

    return {
      marketplace,
      allowedNow: status.tokensRemaining > 0,
      nextAllowedAt: status.nextTokenAt,
      tokensRemaining: status.tokensRemaining,
      resetAt: new Date(Date.now() + 60000), // Bucket resets every minute
      requestsInWindow: status.tokensRemaining,
      consecutiveErrors: status.consecutiveErrors,
    };
  }

  /**
   * Get status for all registered marketplaces
   */
  getAllStatus(): RateLimitStatus[] {
    return Array.from(this.buckets.keys()).map((marketplace) =>
      this.getStatus(marketplace)
    );
  }

  /**
   * Create a rate limiter with default configs for common marketplaces
   */
  static createWithDefaults(): RateLimiter {
    const limiter = new RateLimiter();

    // Conservative defaults - start slow to avoid account blocks
    limiter.registerMarketplace('poshmark', {
      requestsPerMinute: 2,
      backoffMultiplier: 2,
      maxBackoffMs: 300000,
    });

    limiter.registerMarketplace('depop', {
      requestsPerMinute: 2,
      backoffMultiplier: 2,
      maxBackoffMs: 300000,
    });

    limiter.registerMarketplace('ebay', {
      requestsPerMinute: 5,
      backoffMultiplier: 2,
      maxBackoffMs: 300000,
    });

    limiter.registerMarketplace('etsy', {
      requestsPerMinute: 10,
      backoffMultiplier: 2,
      maxBackoffMs: 300000,
    });

    return limiter;
  }
}

/**
 * Global rate limiter instance
 */
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create the global rate limiter
 */
export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = RateLimiter.createWithDefaults();
  }
  return globalRateLimiter;
}

/**
 * Reset the global rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
  globalRateLimiter = null;
}
