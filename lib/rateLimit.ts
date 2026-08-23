interface RateLimitStore {
  [key: string]: number[];
}

const rateLimitMap: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 15 * 60 * 1000
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitMap[identifier]) {
    rateLimitMap[identifier] = [];
  }

  // Filter timestamps within window
  rateLimitMap[identifier] = rateLimitMap[identifier].filter((timestamp) => timestamp > windowStart);

  const currentRequests = rateLimitMap[identifier].length;

  if (currentRequests >= limit) {
    const oldestTimestamp = rateLimitMap[identifier][0];
    const resetTime = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current timestamp
  rateLimitMap[identifier].push(now);

  return {
    success: true,
    limit,
    remaining: limit - (currentRequests + 1),
    reset: Math.ceil(windowMs / 1000),
  };
}

type RequestHeaders = Headers | Record<string, string | string[] | undefined>;

export function getClientIp(req: { headers: RequestHeaders }): string {
  const headers = req.headers;
  const getHeader = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name) ?? undefined;
    }

    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwardedFor = getHeader('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = getHeader('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}
