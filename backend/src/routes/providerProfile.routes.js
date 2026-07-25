const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const {
  normalizePaymentContact,
  getContact,
  PAYMENT_PROVIDERS,
} = require("../utils/paymentContact");

router.use(protect, restrictTo("provider", "superadmin"));

function resolveTargetUserId(req) {
  const { providerId } = req.query;
  if (req.user.role === "superadmin" && providerId) return providerId;
  return req.user._id.toString();
}

async function findProviderUser(id) {
  const user = await User.findById(id).select("-password");
  if (!user) return { error: { status: 404, message: "User not found" } };
  if (user.role !== "provider") {
    return { error: { status: 400, message: "Payment contact applies to provider accounts only" } };
  }
  return { user };
}

// GET /api/provider/payment-contact?providerId= (superadmin)
router.get("/payment-contact", async (req, res) => {
  try {
    const targetId = resolveTargetUserId(req);
    const { user, error } = await findProviderUser(targetId);
    if (error) return res.status(error.status).json({ message: error.message });

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      paymentContact: getContact(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment contact" });
  }
});

// PATCH /api/provider/payment-contact?providerId= (superadmin)
router.patch("/payment-contact", async (req, res) => {
  try {
    const targetId = resolveTargetUserId(req);
    const { user, error } = await findProviderUser(targetId);
    if (error) return res.status(error.status).json({ message: error.message });

    const incoming = normalizePaymentContact(req.body);
    const existing = getContact(user);

    if (req.body.preferredProvider && !PAYMENT_PROVIDERS.includes(req.body.preferredProvider)) {
      return res.status(400).json({ message: "preferredProvider must be khalti" });
    }

    user.paymentContact = {
      ...existing,
      ...incoming,
      khalti: { ...existing.khalti, ...incoming.khalti },
    };

    if (req.user.role !== "superadmin") {
      user.paymentContact.isVerified = existing.isVerified;
    }

    if (incoming.phone) user.phone = incoming.phone;

    await user.save();

    res.json({
      userId: user._id,
      phone: user.phone,
      paymentContact: getContact(user),
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update payment contact" });
  }
});

module.exports = router;
