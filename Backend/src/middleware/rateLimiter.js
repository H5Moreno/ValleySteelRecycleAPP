// Simple in-memory rate limiter
const requestCounts = new Map();
const WINDOW_MS = 1 * 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

const rateLimiter = (req, res, next) => {
  // Skip rate limiting for health checks
  if (req.path === '/api/health') {
    return next();
  }

  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [id, data] of requestCounts.entries()) {
    if (now - data.resetTime > WINDOW_MS) {
      requestCounts.delete(id);
    }
  }
  
  // Get or create client record
  let clientData = requestCounts.get(clientId);
  if (!clientData || (now - clientData.resetTime) > WINDOW_MS) {
    clientData = {
      count: 0,
      resetTime: now
    };
  }
  
  // Increment request count
  clientData.count++;
  requestCounts.set(clientId, clientData);
  
  // Check if limit exceeded
  if (clientData.count > MAX_REQUESTS) {
    console.log(`Rate limit exceeded for IP: ${clientId}, Path: ${req.path}`);
    return res.status(429).json({
      error: "Too many requests, please try again later.",
      retryAfter: "1 minute"
    });
  }
  
  // Add headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS,
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - clientData.count),
    'X-RateLimit-Reset': new Date(clientData.resetTime + WINDOW_MS).toISOString()
  });
  
  next();
};

export default rateLimiter;