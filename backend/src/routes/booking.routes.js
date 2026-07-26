
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking.model");
const Court = require("../models/Court.model");
const User = require("../models/User.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { hasBasicContact, getContact } = require("../utils/paymentContact");

const bookedSlotFilter = {
  status: { $ne: "cancelled" },
};

function isLegacyPaid(b) {
  return (
    b.status === "confirmed" &&
    (b.paymentStatus === "paid" || b.paymentStatus === undefined || b.paymentStatus === null)
  );
}

// All booking routes require login
router.use(protect);


router.get("/slots", async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) return res.status(400).json({ message: "courtId and date required" });

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    const allSlots = [];
    for (let h = 6; h < 22; h++) {
      const start = `${String(h).padStart(2, "0")}:00`;
      const end = `${String(h + 1).padStart(2, "0")}:00`;
      allSlots.push(`${start} - ${end}`);
    }

    const existing = await Booking.find({
      court: courtId,
      date: new Date(date),
      ...bookedSlotFilter,
    }).select("timeSlot status paymentStatus");

    const bookedSlots = new Set();
    for (const b of existing) {
      if (b.status === "pending_payment" || isLegacyPaid(b)) {
        bookedSlots.add(b.timeSlot);
      }
    }

    const slots = allSlots.map((time) => ({ time, booked: bookedSlots.has(time) }));
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch slots" });
  }
});

// POST /api/bookings  — reserve slot (pending payment)
router.post("/", async (req, res) => {
  try {
    const { courtId, date, time } = req.body;

    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ message: "Court not found" });

    const provider = await User.findById(court.provider).select("role paymentContact phone");
    if (!provider || provider.role !== "provider") {
      return res.status(400).json({ message: "Court provider is not configured for bookings" });
    }
    const contact = getContact(provider);
    if (!hasBasicContact(contact)) {
      return res.status(400).json({
        message:
          "This court is not yet available for online payment. The provider must add payment contact details first.",
      });
    }

    const conflict = await Booking.findOne({
      court: courtId,
      date: new Date(date),
      timeSlot: time,
      ...bookedSlotFilter,
    });
    if (conflict) return res.status(409).json({ message: "This slot is already booked" });

    const booking = await Booking.create({
      court: courtId,
      user: req.user._id,
      date: new Date(date),
      timeSlot: time,
      status: "pending_payment",
      paymentStatus: "pending",
      totalPrice: court.pricePerHour,
    });

    await booking.populate("court", "name district pricePerHour address description");
    res.status(201).json({
      booking,
      payment: { providers: ["khalti"] },
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create booking" });
  }
});

// GET /api/bookings/user  — logged-in user's own bookings
router.get("/user", async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("court", "name district pricePerHour address")
      .sort({ date: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// GET /api/bookings/provider  — bookings for provider's courts (before /:id)
router.get("/provider", restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    const courtFilter = req.user.role === "superadmin" ? {} : { provider: req.user._id };
    const courts = await Court.find(courtFilter).select("_id");
    const courtIds = courts.map((c) => c._id);

    const bookings = await Booking.find({ court: { $in: courtIds } })
      .populate("court", "name district pricePerHour address")
      .populate("user", "name email phone")
      .sort({ date: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch provider bookings" });
  }
});

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

// DELETE /api/bookings/:id  — cancel
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

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
    if (booking.paymentStatus === "pending") booking.paymentStatus = "failed";
    await booking.save();
    res.json({ message: "Booking cancelled" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// GET /api/bookings/:id  — single booking (owner)
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("court", "name district pricePerHour address");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking" });
  }
});

module.exports = router;
