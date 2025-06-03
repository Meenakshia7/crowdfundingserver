
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
        validator: Number.isFinite,
        message: 'Goal amount must be a valid number',
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
      enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'withdrawn', 'closed'], // ✅ added admin states
      default: 'pending', // ✅ starts as pending, admin approves
    },
    donations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donation',
      },
    ],
    image: {
      type: String, // filename or image path
      default: null,
    },
    withdrawn: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: [String],
      default: [], // ✅ optional: for filtering/search (e.g., ['health', 'education'])
    },
    deadline: {
      type: Date,
      default: null, // ✅ optional: deadline for campaign
    },
    rejectionReason: {
  type: String,
  default: null,
},

  },
  { timestamps: true }
);

// ✅ Add virtuals or computed fields here if needed later (e.g., progress percentage)

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
