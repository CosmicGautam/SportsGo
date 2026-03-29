const KHALTI_SANDBOX = "https://dev.khalti.com/api/v2";
const KHALTI_PRODUCTION = "https://khalti.com/api/v2";

function baseUrl() {
  return process.env.KHALTI_ENV === "production" ? KHALTI_PRODUCTION : KHALTI_SANDBOX;
}

function authHeader() {
  const key = process.env.KHALTI_SECRET_KEY;
  if (!key) throw new Error("KHALTI_SECRET_KEY is not configured");
  const cleaned = key.replace(/^(key|Key)\s+/i, "").trim();
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
    const msg = data.detail || data.error_key || JSON.stringify(data);
    throw new Error(`Khalti initiate failed: ${msg}`);
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
};
