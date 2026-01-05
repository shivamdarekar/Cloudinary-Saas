import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Define a common interface for rate limiting
interface RateLimitResult {
  success: boolean;
}

interface RateLimiter {
  limit: (identifier: string) => Promise<RateLimitResult>;
}

// In-memory fallback for development
class InMemoryRateLimiter implements RateLimiter {
  private hits: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxRequests = 10;
  private readonly windowMs = 10000; // 10 seconds

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const userHits = this.hits.get(identifier);

    // Clean up old entries periodically
    if (this.hits.size > 1000) {
      for (const [key, value] of this.hits.entries()) {
        if (now > value.resetAt) {
          this.hits.delete(key);
        }
      }
    }

    if (!userHits || now > userHits.resetAt) {
      this.hits.set(identifier, { count: 1, resetAt: now + this.windowMs });
      return { success: true };
    }

    if (userHits.count >= this.maxRequests) {
      return { success: false };
    }

    userHits.count++;
    return { success: true };
  }
}

// Wrapper for Upstash Redis rate limiter
class RedisRateLimiter implements RateLimiter {
  private ratelimit: Ratelimit;

  constructor() {
    this.ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    });
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(identifier);
    return { success: result.success };
  }
}

let rateLimiter: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (rateLimiter) return rateLimiter;

  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      rateLimiter = new RedisRateLimiter();
      // console.log(" Rate limiting using Upstash Redis");
    } else {
      rateLimiter = new InMemoryRateLimiter();
      // console.warn(" Rate limiting using in-memory fallback");
    }
  } catch (error) {
    console.error("Failed to initialize Redis rate limiter, falling back to in-memory:", error);
    rateLimiter = new InMemoryRateLimiter();
  }

  return rateLimiter;
}

// Reusable rate limit check
export async function checkRateLimit(request: Request): Promise<{ success: boolean; error?: string }> {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
    const limiter = getRateLimiter();
    const result = await limiter.limit(ip);
    
    if (!result.success) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the request to proceed (fail open)
    return { success: true };
  }
}