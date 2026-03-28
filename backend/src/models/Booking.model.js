import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  court: {
    type: String,
    ref: "Court",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed",
  },
}, {
  timestamps: true,
});

bookingSchema.index({ court: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model("Booking", bookingSchema);