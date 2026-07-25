const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    court: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled"],
      default: "pending_payment",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentProvider: { type: String, enum: ["khalti", ""], default: "" },
    /** Khalti pidx */
    paymentTxnId: { type: String, default: "" },
    khaltiPidx: { type: String, default: "" },
    totalPrice: { type: Number },
    providerPaymentContact: {
      phone: { type: String, default: "" },
      businessName: { type: String, default: "" },
      khalti: {
        walletId: { type: String, default: "" },
        merchantId: { type: String, default: "" },
      },
      preferredProvider: { type: String, default: "khalti" },
    },
  },
  { timestamps: true }
);

// One active booking per court/slot (cancelled frees the slot)
bookingSchema.index(
  { court: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } }
);

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
