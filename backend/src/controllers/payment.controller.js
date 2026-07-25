const User = require("../models/User.model");

/**
 * GET /api/payments/payment-contact/me
 * Get logged-in provider payment information
 */
exports.getMyPaymentInformation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("paymentContact");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user.paymentContact);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load payment information",
    });
  }
};

/**
 * PUT /api/payments/payment-contact/me
 * Update provider payment information
 */
exports.updateMyPaymentInformation = async (req, res) => {
  try {
    const {
      businessName,
      phone,
      preferredProvider,
      khalti,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.paymentContact = {
      businessName,
      phone,
      preferredProvider,

      khalti: {
        walletId: khalti?.walletId || "",
        merchantId: khalti?.merchantId || "",
      },

      // Any edit requires re-verification
      isVerified: false,
    };

    await user.save();

    res.json({
      message: "Payment information updated successfully.",
      paymentContact: user.paymentContact,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update payment information",
    });
  }
};

/**
 * GET /api/payments/admin/payment-contacts
 * Superadmin - View all provider payment information
 */
exports.getAllPaymentInformation = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
    }).select(
      "name email paymentContact"
    );

    res.json(providers);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load providers",
    });
  }
};

/**
 * PATCH /api/payments/admin/payment-contacts/:userId/verify
 */
exports.verifyPaymentInformation = async (req, res) => {
  try {
    const provider = await User.findById(req.params.userId);

    if (!provider) {
      return res.status(404).json({
        message: "Provider not found",
      });
    }

    provider.paymentContact.isVerified = true;

    await provider.save();

    res.json({
      message: "Provider verified successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Verification failed",
    });
  }
};

/**
 * PATCH /api/payments/admin/payment-contacts/:userId/reject
 */
exports.rejectPaymentInformation = async (req, res) => {
  try {
    const provider = await User.findById(req.params.userId);

    if (!provider) {
      return res.status(404).json({
        message: "Provider not found",
      });
    }

    provider.paymentContact.isVerified = false;

    await provider.save();

    res.json({
      message: "Provider verification removed.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to reject provider",
    });
  }
};