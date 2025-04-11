const mongoose = require('mongoose');

// Define workspace member schema
const workspaceMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'writer', 'viewer'],
      default: 'writer',
    },
    inviteAccepted: {
      type: Boolean,
      default: false,
    },
    inviteToken: {
      type: String,
      select: false, // Don't return by default
    },
    inviteSentAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Define workspace schema
const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['individual', 'team'],
      required: [true, 'Workspace type is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workspace owner is required'],
    },
    members: [workspaceMemberSchema],
    settings: {
      preferredTheme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      defaultPostStyle: {
        type: String,
        enum: ['standard', 'formatted', 'chunky', 'short', 'emojis'],
        default: 'standard',
      },
      defaultLanguage: {
        type: String,
        enum: ['english', 'german'],
        default: 'english',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to add owner as admin if team workspace
workspaceSchema.pre('save', function (next) {
  if (this.isNew && this.type === 'team') {
    // Check if owner is already a member
    const ownerIsMember = this.members.some(
      (member) => member.user.toString() === this.owner.toString()
    );

    if (!ownerIsMember) {
      this.members.push({
        user: this.owner,
        role: 'admin',
        inviteAccepted: true,
      });
    }
  }
  next();
});

// Method to check if a user is a member of workspace
workspaceSchema.methods.isMember = function (userId) {
  return this.members.some((member) => 
    member.user.toString() === userId.toString() && member.inviteAccepted
  );
};

// Method to check if a user is an admin of workspace
workspaceSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) => 
      member.user.toString() === userId.toString() && 
      member.role === 'admin' && 
      member.inviteAccepted
  );
};

// Static method to find workspaces where user is a member
workspaceSchema.statics.findWorkspacesForUser = function (userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 
        members: { 
          $elemMatch: { 
            user: userId, 
            inviteAccepted: true 
          } 
        } 
      },
    ],
  });
};

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace; 