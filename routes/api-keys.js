// routes/api-keys.js - Updated API key management routes
const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth'); // Your existing auth middleware
const ApiKey = require('../model/ApiKey');
const router = express.Router();

// Generate new API key
router.post('/generate', auth, async (req, res) => {
  try {
    const { name, permissions = ['create_room'], ipWhitelist = [], rateLimit } = req.body;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'API key name must be between 3-50 characters'
      });
    }

    // Check if user is elite (only elite users can create API keys)
    if (!req.user.elite) {
      return res.status(403).json({
        success: false,
        error: 'API key generation is only available for Elite members'
      });
    }

    // Check if user already has 5 active keys (limit)
    const existingKeys = await ApiKey.countDocuments({
      user: req.user._id,
      isActive: true
    });

    if (existingKeys >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 active API keys allowed'
      });
    }

    // Validate permissions
    const validPermissions = ['create_room', 'generate_image', 'generate_react', 'extract_room_info'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      });
    }

    // Generate key components
    const keyId = crypto.randomBytes(16).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(secret).digest('hex');

    // Create API key record
    const apiKey = new ApiKey({
      user: req.user._id,
      keyId,
      keyHash,
      name,
      permissions: permissions.length > 0 ? permissions : ['create_room'],
      ipWhitelist,
      rateLimit: rateLimit || {
        requestsPerHour: 100,
        requestsPerDay: 1000
      }
    });

    await apiKey.save();

    // Return the full API key (only time it's shown)
    const fullApiKey = `${keyId}.${secret}`;

    res.json({
      success: true,
      apiKey: {
        id: apiKey._id,
        keyId,
        fullKey: fullApiKey, // Only shown once
        name,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        created: apiKey.createdAt,
        usageCount: 0,
        lastUsed: null,
        isActive: true
      },
      message: 'API key generated successfully. Store it securely - it won\'t be shown again.'
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
      message: error.message
    });
  }
});

// List user's API keys
router.get('/list', auth, async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({
      user: req.user._id
    }).select('-keyHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      apiKeys: apiKeys.map(key => ({
        id: key._id,
        keyId: key.keyId,
        name: key.name,
        permissions: key.permissions,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        rateLimit: key.rateLimit,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        formattedCreatedAt: key.formattedCreatedAt,
        formattedLastUsed: key.formattedLastUsed
      }))
    });

  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys',
      message: error.message
    });
  }
});

// Update API key permissions
router.put('/:keyId', auth, async (req, res) => {
  try {
    const { keyId } = req.params;
    const { permissions, name, rateLimit } = req.body;

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = ['create_room', 'generate_image', 'generate_react', 'extract_room_info'];
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
      }
    }

    const updateData = {};
    if (permissions) updateData.permissions = permissions;
    if (name && name.length >= 3 && name.length <= 50) updateData.name = name;
    if (rateLimit) updateData.rateLimit = rateLimit;

    const apiKey = await ApiKey.findOneAndUpdate(
      { keyId, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key updated successfully',
      apiKey: {
        id: apiKey._id,
        keyId: apiKey.keyId,
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        lastUsed: apiKey.lastUsed,
        usageCount: apiKey.usageCount,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      }
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update API key',
      message: error.message
    });
  }
});

// Revoke API key
router.delete('/:keyId', auth, async (req, res) => {
  try {
    const { keyId } = req.params;

    const apiKey = await ApiKey.findOneAndUpdate(
      { keyId, user: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
      message: error.message
    });
  }
});

// Get API key usage statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await ApiKey.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalKeys: { $sum: 1 },
          activeKeys: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          totalRequests: { $sum: '$usageCount' },
          avgRequestsPerKey: { $avg: '$usageCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalKeys: 0,
      activeKeys: 0,
      totalRequests: 0,
      avgRequestsPerKey: 0
    };

    res.json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Error getting API key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API key statistics',
      message: error.message
    });
  }
});

// Regenerate API key (creates new secret while keeping same keyId)
router.post('/:keyId/regenerate', auth, async (req, res) => {
  try {
    const { keyId } = req.params;

    const existingKey = await ApiKey.findOne({ keyId, user: req.user._id });
    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    const newKeyHash = crypto.createHash('sha256').update(newSecret).digest('hex');

    // Update the key with new hash and reset usage
    existingKey.keyHash = newKeyHash;
    existingKey.usageCount = 0;
    existingKey.lastUsed = null;
    existingKey.isActive = true;
    await existingKey.save();

    const fullApiKey = `${keyId}.${newSecret}`;

    res.json({
      success: true,
      apiKey: {
        id: existingKey._id,
        keyId,
        fullKey: fullApiKey, // Only shown once
        name: existingKey.name,
        permissions: existingKey.permissions,
        rateLimit: existingKey.rateLimit
      },
      message: 'API key regenerated successfully. Store the new key securely.'
    });

  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key',
      message: error.message
    });
  }
});

module.exports = router;