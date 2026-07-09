const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth.middleware");
const Booking = require("../models/Booking.model");
const Court = require("../models/Court.model");
const khalti = require("../services/payment/khalti");
const esewa = require("../services/payment/esewa");
const {
  assertProviderPaymentReady,
  snapshotContact,
} = require("../utils/paymentContact");

const {
  getMyPaymentInformation,
  updateMyPaymentInformation,
  getAllPaymentInformation,
  verifyPaymentInformation,
  rejectPaymentInformation,
} = require("../controllers/payment.controller");

router.use(protect);

async function loadBookingForPayment(bookingId, userId) {
  const booking = await Booking.findById(bookingId).populate({
    path: "court",
    select: "name provider",
    populate: { path: "provider", select: "name email role phone paymentContact" },
  });
  if (!booking) return { error: { status: 404, message: "Booking not found" } };
  if (booking.user.toString() !== userId.toString()) {
    return { error: { status: 403, message: "Not allowed" } };
  }
  if (booking.status !== "pending_payment" || booking.paymentStatus !== "pending") {
    return { error: { status: 400, message: "Booking is not awaiting payment" } };
  }
  return { booking };
}

// POST /api/payments/khalti/initiate  { bookingId }
router.post("/khalti/initiate", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const { booking, error } = await loadBookingForPayment(bookingId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const paymentCheck = await assertProviderPaymentReady(booking.court, "khalti");
    if (!paymentCheck.ok) {
      return res.status(400).json({ message: paymentCheck.message });
    }

    const contact = paymentCheck.contact;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const returnUrl = `${clientUrl}/booking/payment-return?provider=khalti`;

    let init;
    const useLocalDevFallback = process.env.NODE_ENV !== "production" && process.env.KHALTI_DEV_BYPASS === "1";

    if (useLocalDevFallback) {
      const fakePidx = `dev-${booking._id}-${Date.now()}`;
      init = {
        pidx: fakePidx,
        payment_url: `${clientUrl}/booking/payment-return?provider=khalti&pidx=${fakePidx}`,
      };
    } else {
      init = await khalti.initiatePayment({
        returnUrl,
        websiteUrl: clientUrl,
        amountRupees: booking.totalPrice,
        purchaseOrderId: booking._id.toString(),
        purchaseOrderName:
          `Court booking ${booking.court?.name || ""}${contact.businessName ? ` · ${contact.businessName}` : ""}`.trim() ||
          "Court booking",
        customerInfo: {
          name: req.user.name,
          email: req.user.email,
          phone: contact.phone,
        },
        providerContact: contact,
      });
    }

    booking.paymentProvider = "khalti";
    booking.khaltiPidx = init.pidx;
    booking.providerPaymentContact = snapshotContact(contact);
    await booking.save();

    res.json({
      payment_url: init.payment_url,
      pidx: init.pidx,
      bookingId: booking._id,
      devBypass: useLocalDevFallback,
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

    if (process.env.NODE_ENV !== "production" && process.env.KHALTI_DEV_BYPASS === "1") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.paymentTxnId = pidx;
      await booking.save();
      await booking.populate("court", "name district pricePerHour address");
      return res.json({ ok: true, booking, khaltiStatus: "Completed", devBypass: true });
    }

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

    const { booking, error } = await loadBookingForPayment(bookingId, req.user._id);
    if (error) return res.status(error.status).json({ message: error.message });

    const paymentCheck = await assertProviderPaymentReady(booking.court, "esewa");
    if (!paymentCheck.ok) {
      return res.status(400).json({ message: paymentCheck.message });
    }

    const contact = paymentCheck.contact;
    const txUuid = `SG-${booking._id}-${Date.now()}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const productCode =
      contact.esewa?.merchantCode || process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";

    const form = esewa.buildSignedFormFields({
      amount: booking.totalPrice,
      transactionUuid: txUuid,
      productCode,
      successUrl: `${clientUrl}/booking/payment-return?provider=esewa&bookingId=${booking._id}`,
      failureUrl: `${clientUrl}/booking/failure?provider=esewa`,
      providerContact: contact,
    });

    if (!form.configured) {
      return res.status(503).json({
        message: "eSewa is not configured (set ESEWA_MERCHANT_ID and ESEWA_SECRET_KEY)",
        configured: false,
      });
    }

    booking.paymentProvider = "esewa";
    booking.paymentTxnId = txUuid;
    booking.providerPaymentContact = snapshotContact(contact);
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

  router.get("/payment-contact/me", protect, getMyPaymentInformation);

  router.put("/payment-contact/me", protect, updateMyPaymentInformation);

  router.get(
    "/admin/payment-contacts",
    protect,
    restrictTo("superadmin"),
    getAllPaymentInformation
  );

  router.patch(
    "/admin/payment-contacts/:userId/verify",
    protect,
    restrictTo("superadmin"),
    verifyPaymentInformation
  );

  router.patch(
    "/admin/payment-contacts/:userId/reject",
    protect,
    restrictTo("superadmin"),
    rejectPaymentInformation
  );



});

// ==========================
// Provider Payment Information
// ==========================

router.get(
  "/payment-contact/me",
  protect,
  restrictTo("provider"),
  getMyPaymentInformation
);

router.put(
  "/payment-contact/me",
  protect,
  restrictTo("provider"),
  updateMyPaymentInformation
);

// ==========================
// Superadmin Payment Verification
// ==========================

router.get(
  "/admin/payment-contacts",
  protect,
  restrictTo("superadmin"),
  getAllPaymentInformation
);

router.patch(
  "/admin/payment-contacts/:userId/verify",
  protect,
  restrictTo("superadmin"),
  verifyPaymentInformation
);

router.patch(
  "/admin/payment-contacts/:userId/reject",
  protect,
  restrictTo("superadmin"),
  rejectPaymentInformation
);


module.exports = router;
