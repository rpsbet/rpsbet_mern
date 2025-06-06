// model/ApiKey.js - Updated Mongoose model for API keys
const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keyHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  permissions: [{
    type: String,
    enum: ['create_room', 'generate_image'], // Streamlined to only 2 permissions
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  ipWhitelist: [{
    type: String,
    validate: {
      validator: function(ip) {
        // Basic IP validation (supports IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(ip) || ipv6Regex.test(ip);
      },
      message: 'Invalid IP address format'
    }
  }],
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 100,
      min: 1,
      max: 10000
    },
    requestsPerDay: {
      type: Number,
      default: 1000,
      min: 1,
      max: 100000
    }
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from creation
    index: { expireAfterSeconds: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
apiKeySchema.index({ user: 1, isActive: 1 });
apiKeySchema.index({ keyId: 1, isActive: 1 });
apiKeySchema.index({ user: 1, createdAt: -1 });

// Update the updatedAt field on save
apiKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure permissions array is not empty and handle legacy permissions
apiKeySchema.pre('save', function(next) {
  // Handle legacy permissions by mapping them to new ones
  if (this.permissions.includes('generate_react') || this.permissions.includes('extract_room_info')) {
    // If user had these old permissions, give them create_room permission
    if (!this.permissions.includes('create_room')) {
      this.permissions.push('create_room');
    }
    // Remove the old permissions
    this.permissions = this.permissions.filter(p => 
      p !== 'generate_react' && p !== 'extract_room_info'
    );
  }
  
  if (this.permissions.length === 0) {
    this.permissions = ['create_room']; // Default permission
  }
  next();
});

// Virtual for formatted creation date
apiKeySchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for formatted last used date
apiKeySchema.virtual('formattedLastUsed').get(function() {
  if (!this.lastUsed) return 'Never';
  return this.lastUsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for permission display names
apiKeySchema.virtual('formattedPermissions').get(function() {
  const permissionLabels = {
    'create_room': 'Create Rooms & Generate React',
    'generate_image': 'Generate AI Images'
  };
  
  return this.permissions.map(p => permissionLabels[p] || p).join(', ');
});

// Static method to find active keys for a user
apiKeySchema.statics.findActiveByUser = function(userId) {
  return this.find({ user: userId, isActive: true });
};

// Static method to find by keyId and verify it's active
apiKeySchema.statics.findActiveByKeyId = function(keyId) {
  return this.findOne({ 
    keyId, 
    isActive: true, 
    expiresAt: { $gt: new Date() } 
  }).populate('user');
};

// Instance method to increment usage count
apiKeySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to revoke the key
apiKeySchema.methods.revoke = function() {
  this.isActive = false;
  return this.save();
};

// Instance method to check if key has specific permission
apiKeySchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Instance method to add permission if not already present
apiKeySchema.methods.addPermission = function(permission) {
  const validPermissions = ['create_room', 'generate_image'];
  if (validPermissions.includes(permission) && !this.permissions.includes(permission)) {
    this.permissions.push(permission);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove permission
apiKeySchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  // Ensure at least one permission remains
  if (this.permissions.length === 0) {
    this.permissions = ['create_room'];
  }
  return this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema);