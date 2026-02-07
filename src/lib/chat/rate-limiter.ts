interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const MAX_REQUESTS = 20;
const CLEANUP_INTERVAL = 100; // Clean up every N requests

const store = new Map<string, RateLimitEntry>();
let requestCounter = 0;

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > WINDOW_MS) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  requestCounter++;

  // Periodic cleanup
  if (requestCounter % CLEANUP_INTERVAL === 0) {
    cleanup();
  }

  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// Exported for testing
export function resetStore(): void {
  store.clear();
  requestCounter = 0;
}

export function getStoreSize(): number {
  return store.size;
}
