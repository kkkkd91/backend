const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['personal', 'business', 'agency'],
      required: [true, 'Workspace type is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workspace owner is required'],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'editor', 'viewer'],
          default: 'viewer',
        },
      },
    ],
    linkedInProfile: {
      type: String,
      trim: true,
    },
    postFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    },
    postStyle: {
      type: String,
      enum: ['professional', 'casual', 'storytelling', 'educational', 'promotional'],
    },
    inspirationProfiles: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace; 