// models/Booking.model.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    date:  { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g. "09:00 - 10:00"
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    totalPrice: { type: Number },
  },
  { timestamps: true }
);

// Prevent double-booking same court/date/slot
bookingSchema.index({ court: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);