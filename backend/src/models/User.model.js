// models/User.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["user", "provider", "superadmin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    phone: { type: String, trim: true, default: "" },
    paymentContact: {
      phone: { type: String, trim: true, default: "" },
      businessName: { type: String, trim: true, default: "" },
      khalti: {
        walletId: { type: String, trim: true, default: "" },
        merchantId: { type: String, trim: true, default: "" },
      },
      esewa: {
        merchantCode: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
      },
      preferredProvider: {
        type: String,
        enum: ["khalti", "esewa"],
        default: "khalti",
      },
      isVerified: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);