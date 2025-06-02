// middleware/apiAuth.js - API authentication middleware
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const ApiKey = require('../model/ApiKey');
const User = require('../model/User');

const apiAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Please provide an API key in X-API-Key header'
      });
    }

    // Extract key ID and secret from the API key (format: keyId.secret)
    const [keyId, secret] = apiKey.split('.');
    if (!keyId || !secret) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    // Find the API key record
    const apiKeyRecord = await ApiKey.findOne({ 
      keyId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      });
    }

    // Verify the secret
    const expectedHash = crypto.createHash('sha256').update(secret).digest('hex');
    if (apiKeyRecord.keyHash !== expectedHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Check IP whitelist if configured
    if (apiKeyRecord.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!apiKeyRecord.ipWhitelist.includes(clientIP)) {
        return res.status(403).json({
          success: false,
          error: 'IP address not whitelisted'
        });
      }
    }

    // Update usage statistics
    apiKeyRecord.lastUsed = new Date();
    apiKeyRecord.usageCount += 1;
    await apiKeyRecord.save();

    // Attach user and API key info to request
    req.user = apiKeyRecord.user;
    req.apiKey = apiKeyRecord;
    req.isApiRequest = true;

    next();
  } catch (error) {
    console.error('API Auth Error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Permission checker middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permission,
        available: req.apiKey?.permissions || []
      });
    }
    next();
  };
};

// Rate limiting for API
const createApiRateLimit = (windowMs, max, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      if (req.apiKey?.rateLimit) {
        return windowMs === 3600000 ? req.apiKey.rateLimit.requestsPerHour : req.apiKey.rateLimit.requestsPerDay;
      }
      return max;
    },
    keyGenerator: (req) => req.apiKey?.keyId || req.ip,
    skipSuccessfulRequests,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    }
  });
};

module.exports = { 
  apiAuth, 
  requirePermission, 
  createApiRateLimit 
};