
const Campaign = require('../models/Campaign');
const Donation = require('../models/donation');

const getUserDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count campaigns by their statuses
    const pendingCount = await Campaign.countDocuments({ owner: userId, status: 'pending' });
    const rejectedCount = await Campaign.countDocuments({ owner: userId, status: 'rejected' });
    const activeCount = await Campaign.countDocuments({ owner: userId, status: 'active' });
    const completedCount = await Campaign.countDocuments({ owner: userId, status: 'completed' });

    // Withdrawn campaigns
    const withdrawnCount = await Campaign.countDocuments({ owner: userId, withdrawn: true });

    // Deleted campaigns — assuming status 'closed' means deleted
    const deletedCount = await Campaign.countDocuments({ owner: userId, status: 'closed' });

    // Total donation amount made by the user
    const donationsMadeAgg = await Donation.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonationsMade = donationsMadeAgg[0]?.total || 0;

    // Total donation amount received for campaigns created by this user
    const donationsReceivedAgg = await Donation.aggregate([
      {
        $lookup: {
          from: 'campaigns',
          localField: 'campaign',
          foreignField: '_id',
          as: 'campaignData'
        }
      },
      { $unwind: '$campaignData' },
      { $match: { 'campaignData.owner': userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonationsReceived = donationsReceivedAgg[0]?.total || 0;

    res.status(200).json({
      pendingCount,
      rejectedCount,
      activeCount,
      completedCount,
      withdrawnCount,
      deletedCount,
      totalDonationsMade,
      totalDonationsReceived,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard overview' });
  }
};

module.exports = {
  getUserDashboardOverview,
};
