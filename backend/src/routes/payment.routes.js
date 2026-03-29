const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Booking = require("../models/Booking.model");
const khalti = require("../services/payment/khalti");
const esewa = require("../services/payment/esewa");

router.use(protect);

// POST /api/payments/khalti/initiate  { bookingId }
router.post("/khalti/initiate", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const booking = await Booking.findById(bookingId).populate("court", "name");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (booking.status !== "pending_payment" || booking.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Booking is not awaiting payment" });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const returnUrl = `${clientUrl}/booking/payment-return?provider=khalti`;

    const init = await khalti.initiatePayment({
      returnUrl,
      websiteUrl: clientUrl,
      amountRupees: booking.totalPrice,
      purchaseOrderId: booking._id.toString(),
      purchaseOrderName: `Court booking ${booking.court?.name || ""}`.trim() || "Court booking",
      customerInfo: {
        name: req.user.name,
        email: req.user.email,
      },
    });

    booking.paymentProvider = "khalti";
    booking.khaltiPidx = init.pidx;
    await booking.save();

    res.json({
      payment_url: init.payment_url,
      pidx: init.pidx,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("Khalti initiate:", err);
    res.status(400).json({ message: err.message || "Payment initiation failed" });
  }
});

// POST /api/payments/khalti/verify  { pidx }
router.post("/khalti/verify", async (req, res) => {
  try {
    const pidx = req.body.pidx || req.query.pidx;
    if (!pidx) return res.status(400).json({ message: "pidx required" });

    const booking = await Booking.findOne({ khaltiPidx: pidx, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found for this payment" });

    const lookup = await khalti.lookupPayment(pidx);

    if (lookup.status === "Completed") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.paymentTxnId = lookup.transaction_id || booking.paymentTxnId;
      await booking.save();
      await booking.populate("court", "name district pricePerHour address");
      return res.json({ ok: true, booking, khaltiStatus: lookup.status });
    }

    if (lookup.status === "Pending" || lookup.status === "Initiated") {
      return res.json({ ok: false, pending: true, khaltiStatus: lookup.status });
    }

    booking.paymentStatus = "failed";
    booking.status = "cancelled";
    await booking.save();
    res.status(402).json({ ok: false, message: "Payment not completed", khaltiStatus: lookup.status });
  } catch (err) {
    console.error("Khalti verify:", err);
    res.status(400).json({ message: err.message || "Verification failed" });
  }
});

// POST /api/payments/esewa/initiate  { bookingId }
router.post("/esewa/initiate", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const booking = await Booking.findById(bookingId).populate("court", "name");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }
    if (booking.status !== "pending_payment" || booking.paymentStatus !== "pending") {
      return res.status(400).json({ message: "Booking is not awaiting payment" });
    }

    const txUuid = `SG-${booking._id}-${Date.now()}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const form = esewa.buildSignedFormFields({
      amount: booking.totalPrice,
      transactionUuid: txUuid,
      productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
      successUrl: `${clientUrl}/booking/payment-return?provider=esewa&bookingId=${booking._id}`,
      failureUrl: `${clientUrl}/booking/failure?provider=esewa`,
    });

    if (!form.configured) {
      return res.status(503).json({
        message: "eSewa is not configured (set ESEWA_MERCHANT_ID and ESEWA_SECRET_KEY)",
        configured: false,
      });
    }

    booking.paymentProvider = "esewa";
    booking.paymentTxnId = txUuid;
    await booking.save();

    res.json({
      bookingId: booking._id,
      actionUrl: form.actionUrl,
      fields: form.fields,
    });
  } catch (err) {
    console.error("eSewa initiate:", err);
    res.status(400).json({ message: err.message || "eSewa initiation failed" });
  }
});

/**
 * POST /api/payments/esewa/verify
 * eSewa success redirect includes encoded data; merchants decode + validate per docs.
 * This stub accepts { bookingId, refId? } for development when ESEWA_DEV_BYPASS=1.
 */
router.post("/esewa/verify", async (req, res) => {
  try {
    const { bookingId, refId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const booking = await Booking.findById(bookingId);
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (process.env.ESEWA_DEV_BYPASS === "1") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      if (refId) booking.paymentTxnId = refId;
      await booking.save();
      await booking.populate("court", "name district pricePerHour address");
      return res.json({ ok: true, booking, devBypass: true });
    }

    return res.status(501).json({
      message:
        "Complete eSewa verification per official docs (decode success callback, validate signature). Enable ESEWA_DEV_BYPASS=1 for local testing only.",
    });
  } catch (err) {
    console.error("eSewa verify:", err);
    res.status(400).json({ message: err.message || "Verification failed" });
  }
});

module.exports = router;
