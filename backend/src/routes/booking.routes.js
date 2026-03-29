// routes/booking.routes.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Court = require("../models/Court.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// All booking routes require login
router.use(protect);

// ─── USER ────────────────────────────────────────────────────────────────────

// GET /api/bookings/slots?courtId=...&date=...
router.get("/slots", async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) return res.status(400).json({ message: "courtId and date required" });

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    // Generate hourly slots 06:00 – 22:00
    const allSlots = [];
    for (let h = 6; h < 22; h++) {
      const start = `${String(h).padStart(2, "0")}:00`;
      const end   = `${String(h + 1).padStart(2, "0")}:00`;
      allSlots.push(`${start} - ${end}`);
    }

    const existing = await Booking.find({
      court: courtId,
      date: new Date(date),
      status: "confirmed",
    }).select("timeSlot");

    const bookedSlots = new Set(existing.map((b) => b.timeSlot));

    const slots = allSlots.map((time) => ({ time, booked: bookedSlots.has(time) }));
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch slots" });
  }
});

// POST /api/bookings  — user books a slot
router.post("/", async (req, res) => {
  try {
    const { courtId, date, time } = req.body;

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    // Check availability
    const conflict = await Booking.findOne({ court: courtId, date: new Date(date), timeSlot: time, status: "confirmed" });
    if (conflict) return res.status(409).json({ message: "This slot is already booked" });

    const booking = await Booking.create({
      court: courtId,
      user: req.user._id,
      date: new Date(date),
      timeSlot: time,
      totalPrice: court.pricePerHour,
    });

    await booking.populate("court", "name location pricePerHour");
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create booking" });
  }
});

// GET /api/bookings/user  — logged-in user's own bookings
router.get("/user", async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("court", "name location pricePerHour district")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// DELETE /api/bookings/:id  — user cancels their own booking
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Superadmin can cancel any; provider can cancel bookings on their courts; user cancels own
    const isSuperAdmin = req.user.role === "superadmin";
    const isOwner = booking.user.toString() === req.user._id.toString();

    let isProviderCourt = false;
    if (req.user.role === "provider") {
      const court = await Court.findById(booking.court);
      isProviderCourt = court?.provider.toString() === req.user._id.toString();
    }

    if (!isSuperAdmin && !isOwner && !isProviderCourt) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ─── PROVIDER ────────────────────────────────────────────────────────────────

// GET /api/bookings/provider  — bookings for provider's courts
router.get("/provider", restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    // Find courts owned by this provider
    const courtFilter = req.user.role === "superadmin" ? {} : { provider: req.user._id };
    const courts = await Court.find(courtFilter).select("_id");
    const courtIds = courts.map((c) => c._id);

    const bookings = await Booking.find({ court: { $in: courtIds } })
      .populate("court", "name district pricePerHour")
      .populate("user", "name email")
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch provider bookings" });
  }
});

// ─── SUPERADMIN ──────────────────────────────────────────────────────────────

// GET /api/bookings/all
router.get("/all", restrictTo("superadmin"), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("court", "name district pricePerHour")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all bookings" });
  }
});

// ─── SUPERADMIN: User management ─────────────────────────────────────────────

// GET /api/bookings/admin/users  (re-use same router for convenience)
// Better placed in a users.routes.js — see note in README

module.exports = router;