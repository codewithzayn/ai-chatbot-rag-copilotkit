/**
 * Simple in-memory rate limiting utility
 * Note: For production with multiple instances, use Redis or a dedicated service.
 */
export class RateLimiter {
  private limitMap = new Map<string, { count: number; resetTime: number }>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request from the given key (e.g., IP) is allowed
   * @param key The unique identifier for the client (usually IP address)
   * @returns true if allowed, false if limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const record = this.limitMap.get(key);

    // If no record or window has expired, reset/create record
    if (!record || now > record.resetTime) {
      this.limitMap.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      return false;
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Manually clean up expired entries to prevent memory leaks in long-running processes
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.limitMap.entries()) {
      if (now > record.resetTime) {
        this.limitMap.delete(key);
      }
    }
  }
}

// Singleton instances for common limits
export const uploadRateLimiter = new RateLimiter(10, 60000); // 10 uploads per min
export const chatRateLimiter = new RateLimiter(30, 60000);   // 30 messages per min
