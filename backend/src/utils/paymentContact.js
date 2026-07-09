const PAYMENT_PROVIDERS = ["khalti", "esewa"];

function normalizePaymentContact(body = {}) {
  const khalti = body.khalti || {};
  const esewa = body.esewa || {};
  return {
    phone: body.phone != null ? String(body.phone).trim() : "",
    businessName: body.businessName != null ? String(body.businessName).trim() : "",
    khalti: {
      walletId: khalti.walletId != null ? String(khalti.walletId).trim() : "",
      merchantId: khalti.merchantId != null ? String(khalti.merchantId).trim() : "",
    },
    esewa: {
      merchantCode: esewa.merchantCode != null ? String(esewa.merchantCode).trim() : "",
      phone: esewa.phone != null ? String(esewa.phone).trim() : "",
    },
    preferredProvider: PAYMENT_PROVIDERS.includes(body.preferredProvider)
      ? body.preferredProvider
      : "khalti",
    isVerified: Boolean(body.isVerified),
  };
}

function getContact(user) {
  if (!user?.paymentContact) return normalizePaymentContact({});
  return normalizePaymentContact(user.paymentContact.toObject?.() || user.paymentContact);
}

function hasBasicContact(contact) {
  return Boolean(contact.phone);
}

function validateForProvider(contact, provider) {
  if (!hasBasicContact(contact)) {
    return {
      ok: false,
      message: "Provider payment phone is required before accepting online bookings",
    };
  }

  if (provider === "khalti") {
    const hasKhalti =
      Boolean(contact.khalti?.walletId) || Boolean(contact.khalti?.merchantId);
    if (!hasKhalti) {
      return {
        ok: false,
        message:
          "This court is not yet available for online payment. Provider must add Khalti wallet or merchant ID.",
      };
    }
  }

  if (provider === "esewa") {
    if (!contact.esewa?.merchantCode) {
      return {
        ok: false,
        message:
          "This court is not yet available for online payment. Provider must add an eSewa merchant code.",
      };
    }
  }

  return { ok: true };
}

function snapshotContact(contact) {
  const c = normalizePaymentContact(contact);
  return {
    phone: c.phone,
    businessName: c.businessName,
    khalti: { ...c.khalti },
    esewa: { ...c.esewa },
    preferredProvider: c.preferredProvider,
    isVerified: c.isVerified,
  };
}

async function loadProviderForCourt(court) {
  const User = require("../models/User.model");
  const providerId = court?.provider?._id || court?.provider;
  if (!providerId) return null;
  return User.findById(providerId).select("name email role paymentContact phone");
}

async function assertProviderPaymentReady(court, provider = "khalti") {
  const user = await loadProviderForCourt(court);
  if (!user || user.role !== "provider") {
    return { ok: false, message: "Court provider not found", providerUser: null, contact: null };
  }
  const contact = getContact(user);
  const check = validateForProvider(contact, provider);
  return { ...check, providerUser: user, contact };
}

module.exports = {
  PAYMENT_PROVIDERS,
  normalizePaymentContact,
  getContact,
  hasBasicContact,
  validateForProvider,
  snapshotContact,
  loadProviderForCourt,
  assertProviderPaymentReady,
};
