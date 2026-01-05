import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback for development
class InMemoryRateLimiter {
  private hits: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly limit = 10;
  private readonly window = 10000; // 10 seconds

  async limit(identifier: string) {
    const now = Date.now();
    const userHits = this.hits.get(identifier);

    if (!userHits || now > userHits.resetAt) {
      this.hits.set(identifier, { count: 1, resetAt: now + this.window });
      return { success: true };
    }

    if (userHits.count >= this.limit) {
      return { success: false };
    }

    userHits.count++;
    return { success: true };
  }
}

let rateLimiter: Ratelimit | InMemoryRateLimiter;

export function getRateLimiter() {
  if (rateLimiter) return rateLimiter;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    rateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
    });
  } else {
    console.warn("⚠️ Rate limiting using in-memory fallback");
    rateLimiter = new InMemoryRateLimiter();
  }

  return rateLimiter;
}

// Reusable rate limit check
export async function checkRateLimit(request: Request): Promise<{ success: boolean; error?: string }> {
  const ip = (request.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
  const { success } = await getRateLimiter().limit(ip);
  
  if (!success) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }
  
  return { success: true };
}