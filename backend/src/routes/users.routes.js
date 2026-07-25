
const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { normalizePaymentContact } = require("../utils/paymentContact");

router.use(protect, restrictTo("superadmin"));

// GET /api/users  — list all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// POST /api/users/create-provider  — superadmin creates a provider account
router.post("/create-provider", async (req, res) => {
  try {
    const { name, email, password, paymentContact, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const contact = paymentContact ? normalizePaymentContact(paymentContact) : undefined;

    const user = await User.create({
      name,
      email,
      password,
      role: "provider",
      phone: phone || contact?.phone || "",
      paymentContact: contact,
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      paymentContact: user.paymentContact,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create provider" });
  }
});

// PATCH /api/users/:id/payment-contact — superadmin edits provider wallet details
router.patch("/:id/payment-contact", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "provider") {
      return res.status(400).json({ message: "Payment contact applies to provider accounts only" });
    }

    const incoming = normalizePaymentContact(req.body);
    const existing = normalizePaymentContact(user.paymentContact || {});

    user.paymentContact = {
      ...existing,
      ...incoming,
      khalti: { ...existing.khalti, ...incoming.khalti },
      isVerified: req.body.isVerified !== undefined ? Boolean(req.body.isVerified) : existing.isVerified,
    };
    if (incoming.phone) user.phone = incoming.phone;

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      paymentContact: user.paymentContact,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update payment contact" });
  }
});

// PATCH /api/users/:id/role  — change a user's role
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "provider", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to update role" });
  }
});

// PATCH /api/users/:id/toggle-active  — activate/deactivate a user
router.patch("/:id/toggle-active", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ _id: user._id, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle user status" });
  }
});

module.exports = router;