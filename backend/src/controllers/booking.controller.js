import Booking from "../models/Booking.model.js";
import { generateSlots } from "../utils/generateSlots.js";
import mongoose from "mongoose";
export const getSlots = async (req, res) => {
  try {
    const { courtId, date } = req.query;
    const booked = await Booking.find({ court: courtId, date });

    const slots = generateSlots().map(slot => ({
      time: slot,
      booked: booked.some(b => b.timeSlot === slot)
    }));

    res.json(slots);
  } catch (error) {
    console.error("Get slots error:", error);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

export const createBooking = async (req, res) => {
  const { courtId, date, time } = req.body;

  try {
    const booking = await Booking.create({
      user: req.user.id,
      court: courtId,
      date,
      timeSlot: time
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(409).json({ message: "Slot already booked" });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('court')
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};


// Update booking payment status (Provider)
export const updateBookingPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body;

    // 1. Verify User is Authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 2. Validate MongoDB ObjectId Format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }

    // 3. Find Booking
    const booking = await Booking.findById(bookingId).populate("court");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 4. Safe Authorization Check (handles null court/owner safely)
    const courtOwnerId = booking.court?.owner?.toString() || booking.court?.user?.toString();
    const currentUserId = req.user._id?.toString() || req.user.id?.toString();

    const isOwner = courtOwnerId && currentUserId && courtOwnerId === currentUserId;
    const isAdmin = req.user.role === "admin" || req.user.isSuperAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to modify this booking" });
    }

    // 5. Update Payment & Booking Statuses safely
    // Match these string values to whatever enum options exist in your Booking model
    booking.paymentStatus = paymentStatus || "completed";

    if (paymentStatus === "completed" || paymentStatus === "paid") {
      booking.status = "confirmed";
    } else if (paymentStatus === "cancelled" || paymentStatus === "failed") {
      booking.status = "cancelled";
    }

    await booking.save();

    return res.status(200).json({
      message: "Payment status updated successfully",
      booking,
    });
  } catch (error) {
    // THIS LINE WILL PRINT THE EXACT CAUSE IN YOUR BACKEND TERMINAL
    console.error("🔥 Error in updateBookingPaymentStatus:", error);

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};


// Get all bookings (admin only)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('court')
      .sort({ date: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// backend/controllers/bookingController.js
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if slot has already passed
    if (isSlotPassed(booking.date, booking.timeSlot)) {
      return res.status(400).json({ 
        message: "Cannot cancel a booking after the time slot has passed." 
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};