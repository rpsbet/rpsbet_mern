// Rate limiting handler for IPFS gateways
// Implements exponential backoff and request queuing

const RATE_LIMIT_CODES = [429, 503, 502, 504];
const MAX_RETRY_ATTEMPTS = 3;
const BASE_DELAY = 1000; // 1 second
const MAX_DELAY = 30000; // 30 seconds

// Track rate limits per gateway
const rateLimitInfo = new Map();

/**
 * Check if an error is rate limit related
 * @param {Error|Response} error - Error object or response
 * @returns {boolean} - True if rate limited
 */
export function isRateLimited(error) {
  if (error.status && RATE_LIMIT_CODES.includes(error.status)) {
    return true;
  }
  if (error.message && error.message.includes('429')) {
    return true;
  }
  if (error.message && error.message.includes('Too Many Requests')) {
    return true;
  }
  return false;
}

/**
 * Get retry delay with exponential backoff
 * @param {number} attempt - Current attempt number
 * @returns {number} - Delay in milliseconds
 */
export function getRetryDelay(attempt) {
  const delay = BASE_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, MAX_DELAY);
}

/**
 * Mark a gateway as rate limited
 * @param {string} gateway - Gateway URL
 * @param {number} retryAfter - Retry after seconds (from header)
 */
export function markRateLimited(gateway, retryAfter = null) {
  const delay = retryAfter ? retryAfter * 1000 : BASE_DELAY;
  const until = Date.now() + delay;
  
  rateLimitInfo.set(gateway, {
    rateLimitedUntil: until,
    attempts: (rateLimitInfo.get(gateway)?.attempts || 0) + 1,
  });
  
  console.warn(`Gateway ${gateway} rate limited until ${new Date(until).toLocaleTimeString()}`);
}

/**
 * Check if a gateway is currently rate limited
 * @param {string} gateway - Gateway URL
 * @returns {boolean} - True if rate limited
 */
export function isGatewayRateLimited(gateway) {
  const info = rateLimitInfo.get(gateway);
  if (!info) return false;
  
  if (Date.now() < info.rateLimitedUntil) {
    return true;
  }
  
  // Clear expired rate limit info
  rateLimitInfo.delete(gateway);
  return false;
}

/**
 * Wait for rate limit to expire
 * @param {string} gateway - Gateway URL
 * @returns {Promise<void>} - Promise that resolves when rate limit expires
 */
export function waitForRateLimit(gateway) {
  return new Promise((resolve) => {
    const info = rateLimitInfo.get(gateway);
    if (!info || Date.now() >= info.rateLimitedUntil) {
      resolve();
      return;
    }
    
    const delay = info.rateLimitedUntil - Date.now();
    setTimeout(resolve, delay);
  });
}

/**
 * Fetch with automatic rate limit handling
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithRateLimit(url, options = {}) {
  const gateway = url.split('/ipfs/')[0] + '/ipfs/';
  
  // Wait if gateway is rate limited
  if (isGatewayRateLimited(gateway)) {
    await waitForRateLimit(gateway);
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (RATE_LIMIT_CODES.includes(response.status)) {
        const retryAfter = response.headers.get('retry-after');
        markRateLimited(gateway, retryAfter ? parseInt(retryAfter) : null);
        
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw new Error(`Rate limited after ${MAX_RETRY_ATTEMPTS} attempts`);
        }
        
        const delay = getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      if (isRateLimited(error)) {
        markRateLimited(gateway);
        
        if (attempt === MAX_RETRY_ATTEMPTS) {
          throw error;
        }
        
        const delay = getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }\n    }\n  }\n  \n  throw lastError;\n}\n\n/**\n * Get rate limit statistics\n * @returns {object} - Rate limit statistics\n */\nexport function getRateLimitStats() {\n  const stats = {};\n  \n  for (const [gateway, info] of rateLimitInfo.entries()) {\n    stats[gateway] = {\n      isRateLimited: Date.now() < info.rateLimitedUntil,\n      rateLimitedUntil: new Date(info.rateLimitedUntil).toLocaleString(),\n      attempts: info.attempts,\n    };\n  }\n  \n  return stats;\n}\n\nexport default {\n  isRateLimited,\n  getRetryDelay,\n  markRateLimited,\n  isGatewayRateLimited,\n  waitForRateLimit,\n  fetchWithRateLimit,\n  getRateLimitStats,\n};