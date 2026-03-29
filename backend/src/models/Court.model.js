// models/Court.model.js
const mongoose = require("mongoose");

const DISTRICTS = [
  "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Butwal", "Biratnagar", "Dharan", "Birgunj", "Hetauda",
];

const courtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      required: true,
      enum: ["Futsal", "Basketball", "Volleyball", "Tennis", "Badminton"],
    },

    description: { type: String, required: true },

    district: {
      type: String,
      required: true,
      enum: DISTRICTS,
    },

    address: { type: String, trim: true }, // street-level detail

    pricePerHour: { type: Number, required: true, min: 0 },

    image: { type: String, default: "" },

    amenities: [{ type: String }], // ["Floodlights", "Parking", ...]

    // Provider who owns this court
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fast filtering
courtSchema.index({ type: 1, district: 1, pricePerHour: 1 });

module.exports = mongoose.models.Court || mongoose.model("Court", courtSchema);