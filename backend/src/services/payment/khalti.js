const KHALTI_SANDBOX = "https://dev.khalti.com/api/v2";
const KHALTI_PRODUCTION = "https://khalti.com/api/v2";

function baseUrl() {
  return process.env.KHALTI_ENV === "production" ? KHALTI_PRODUCTION : KHALTI_SANDBOX;
}

function resolveClientBaseUrl(env = process.env) {
  return env.CLIENT_URL || env.FRONTEND_URL || "http://localhost:5173";
}

function isKhaltiCompletedStatus(status) {
  return String(status || "").trim().toLowerCase() === "completed";
}

function authHeader() {
  const key = process.env.KHALTI_SECRET_KEY || process.env.KHALTI_TEST_SECRET_KEY;
  if (!key || !String(key).trim()) {
    throw new Error("KHALTI_SECRET_KEY is not configured");
  }

  const trimmed = String(key).trim();
  const cleaned = trimmed.replace(/^Key\s+/i, "").trim();
  return `Key ${cleaned}`;
}

/**
 * Amount in NPR rupees → paisa for Khalti API
 */
function rupeesToPaisa(rupees) {
  return Math.round(Number(rupees) * 100);
}

async function initiatePayment({
  returnUrl,
  websiteUrl,
  amountRupees,
  purchaseOrderId,
  purchaseOrderName,
  customerInfo,
  providerContact,
}) {
  const url = `${baseUrl()}/epayment/initiate/`;
  const amount = Math.max(1000, rupeesToPaisa(amountRupees));

  const body = {
    return_url: returnUrl,
    website_url: websiteUrl,
    amount,
    purchase_order_id: String(purchaseOrderId),
    purchase_order_name: String(purchaseOrderName).slice(0, 120),
  };
  if (customerInfo) body.customer_info = customerInfo;

  if (providerContact) {
    body.merchant_extra = {
      provider_phone: providerContact.phone,
      provider_business: providerContact.businessName || "",
      khalti_wallet_id: providerContact.khalti?.walletId || "",
      khalti_merchant_id: providerContact.khalti?.merchantId || "",
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.error_key || data.message || JSON.stringify(data);
    const normalized = String(msg || "").trim();
    if (normalized.toLowerCase().includes("invalid token")) {
      throw new Error(
        "Khalti initiate failed: the configured KHALTI_SECRET_KEY is invalid. Use a real sandbox/production secret from the Khalti dashboard."
      );
    }
    throw new Error(`Khalti initiate failed: ${normalized || "Unknown error"}`);
  }
  return {
    pidx: data.pidx,
    payment_url: data.payment_url,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
  };
}

async function lookupPayment(pidx) {
  const url = `${baseUrl()}/epayment/lookup/`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || data.error_key || JSON.stringify(data);
    throw new Error(`Khalti lookup failed: ${msg}`);
  }
  return data;
}

module.exports = {
  initiatePayment,
  lookupPayment,
  rupeesToPaisa,
  resolveClientBaseUrl,
  isKhaltiCompletedStatus,
};
