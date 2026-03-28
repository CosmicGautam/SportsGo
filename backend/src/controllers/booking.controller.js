import Booking from "../models/Booking.model.js";
import { generateSlots } from "../utils/generateSlots.js";

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

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await booking.deleteOne();
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Error cancelling booking" });
  }
};