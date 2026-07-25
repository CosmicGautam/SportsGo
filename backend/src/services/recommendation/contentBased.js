const Booking = require("../../models/Booking.model");
const Court = require("../../models/Court.model");

const PRICE_BUCKET_SIZE = 500;

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function courtFeatureText(court) {
  const parts = [
    court.type,
    court.description,
    court.district,
    court.address,
    court.name,
    ...(court.amenities || []),
  ];
  return tokenize(parts.filter(Boolean).join(" "));
}

function addTermWeight(vec, term, w) {
  if (!term) return;
  vec[term] = (vec[term] || 0) + w;
}

function normalize(vec) {
  const sumSq = Object.values(vec).reduce((s, v) => s + v * v, 0);
  const norm = Math.sqrt(sumSq) || 1;
  const out = {};
  for (const k of Object.keys(vec)) out[k] = vec[k] / norm;
  return out;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  for (const k of Object.keys(a)) {
    if (b[k]) dot += a[k] * b[k];
  }
  return dot;
}

/**
 * Preference vector from user's paid bookings.
 */
async function buildUserPreferenceVector(userId) {
  const bookings = await Booking.find({
    user: userId,
    status: "confirmed",
    $or: [{ paymentStatus: "paid" }, { paymentStatus: { $exists: false } }],
  })
    .populate("court")
    .lean();

  const vec = {};
  let weightSum = 0;

  for (const b of bookings) {
    const court = b.court;
    if (!court) continue;
    const w = 1;
    weightSum += w;
    addTermWeight(vec, `type:${court.type}`, w * 2);
    addTermWeight(vec, `district:${court.district}`, w * 1.5);
    const bucket = Math.floor(Number(court.pricePerHour || 0) / PRICE_BUCKET_SIZE);
    addTermWeight(vec, `price:${bucket}`, w);
    for (const a of court.amenities || []) {
      addTermWeight(vec, `amenity:${String(a).toLowerCase()}`, w * 0.5);
    }
    for (const t of courtFeatureText(court)) {
      addTermWeight(vec, t, w * 0.3);
    }
  }

  if (weightSum === 0) return null;
  return normalize(vec);
}

function courtToPreferenceVector(court) {
  const vec = {};
  addTermWeight(vec, `type:${court.type}`, 2);
  addTermWeight(vec, `district:${court.district}`, 1.5);
  const bucket = Math.floor(Number(court.pricePerHour || 0) / PRICE_BUCKET_SIZE);
  addTermWeight(vec, `price:${bucket}`, 1);
  for (const a of court.amenities || []) {
    addTermWeight(vec, `amenity:${String(a).toLowerCase()}`, 0.5);
  }
  for (const t of courtFeatureText(court)) {
    addTermWeight(vec, t, 0.3);
  }
  return normalize(vec);
}

/**
 * @param {string} userId
 * @param {{ limit?: number, excludeIds?: string[] }} opts
 */
async function scoreCourtsForUser(userId, opts = {}) {
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
  const pref = await buildUserPreferenceVector(userId);
  const filter = { isActive: true };
  if (opts.excludeIds?.length) {
    filter._id = { $nin: opts.excludeIds };
  }

  const courts = await Court.find(filter).populate("provider", "name email").lean();

  if (!pref) {
    return courts.slice(0, limit).map((c) => ({ court: c, score: 0 }));
  }

  const scored = courts.map((c) => {
    const cv = courtToPreferenceVector(c);
    const s = cosineSimilarity(pref, cv);
    return { court: c, score: s };
  });

  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit);
}

module.exports = {
  buildUserPreferenceVector,
  scoreCourtsForUser,
  courtFeatureText,
};
