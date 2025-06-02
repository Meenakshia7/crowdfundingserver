
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required'],
      trim: true,
    },
    goalAmount: {
      type: Number,
      required: [true, 'Goal amount is required'],
      min: [1, 'Goal amount must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Goal amount must be an integer',
      },
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Raised amount cannot be negative'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Campaign owner is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'withdrawn', 'closed'],  // ✅ added completed + withdrawn
      default: 'active',
    },
    donations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
      },
    ],
    image: {
      type: String, // stores the filename or image path
      default: null,
    },
    withdrawn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
