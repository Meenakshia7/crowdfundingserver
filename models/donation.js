
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [1, 'Donation must be at least $1'],
    },
    message: {
      type: String,
      maxlength: 200,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
  },
  { timestamps: true }
);

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;
