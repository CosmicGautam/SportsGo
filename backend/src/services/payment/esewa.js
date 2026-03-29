/**
 * eSewa v2 (EPay) — configuration-driven helper.
 * Full redirect flow requires merchant ID, signed payload, and success/failure URLs per eSewa docs.
 * When secrets are missing, initiate returns { configured: false } so callers can respond gracefully.
 */

function isConfigured() {
  return !!(process.env.ESEWA_MERCHANT_ID && process.env.ESEWA_SECRET_KEY);
}

/**
 * Build signed v2 request fields (simplified hash per common eSewa integration pattern).
 * Adjust field names to match your eSewa merchant dashboard / latest API version.
 */
function buildSignedFormFields({
  amount,
  transactionUuid,
  productCode = "EPAYTEST",
  successUrl,
  failureUrl,
}) {
  if (!isConfigured()) {
    return { configured: false };
  }

  const merchantId = process.env.ESEWA_MERCHANT_ID;
  const secret = process.env.ESEWA_SECRET_KEY;
  const crypto = require("crypto");
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const totalAmount = Number(amount).toFixed(2);
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = crypto.createHash("sha256").update(`${secret}${message}`).digest("base64");

  return {
    configured: true,
    actionUrl:
      process.env.ESEWA_ENV === "production"
        ? "https://esewa.com.np/epayment/main"
        : "https://rc.esewa.com.np/epayment/main",
    fields: {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: successUrl || process.env.ESEWA_SUCCESS_URL || `${clientUrl}/booking/payment-return?provider=esewa`,
      failure_url: failureUrl || process.env.ESEWA_FAILURE_URL || `${clientUrl}/booking/failure?provider=esewa`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
      merchant_id: merchantId,
    },
  };
}

module.exports = {
  isConfigured,
  buildSignedFormFields,
};
