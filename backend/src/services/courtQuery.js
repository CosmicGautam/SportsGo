const Court = require("../models/Court.model");

const SORT_MAP = {
  price_asc: { pricePerHour: 1 },
  price_desc: { pricePerHour: -1 },
  newest: { createdAt: -1 },
  relevance: { score: { $meta: "textScore" } },
};

function parseAmenitiesParam(raw) {
  if (raw === undefined || raw === null || raw === "") return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build filter + sort + pagination for public court listing.
 * @param {Record<string, string | string[] | undefined>} q - req.query
 */
function buildCourtListOptions(q) {
  const {
    type,
    district,
    minPrice,
    maxPrice,
    search,
    amenities,
    sort: sortRaw,
    page: pageRaw,
    limit: limitRaw,
  } = q;

  const filter = { isActive: true };

  if (type && type !== "All") filter.type = type;
  if (district && district !== "All") filter.district = district;

  const amenityList = parseAmenitiesParam(amenities);
  if (amenityList.length) {
    filter.amenities = { $all: amenityList };
  }

  if (minPrice || maxPrice) {
    filter.pricePerHour = {};
    if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
    if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
  }

  let useTextScore = false;
  if (search && String(search).trim()) {
    filter.$text = { $search: String(search).trim() };
    useTextScore = true;
  }

  let sort = SORT_MAP.newest;
  const sortKey = sortRaw && String(sortRaw);
  if (sortKey === "relevance" && useTextScore) {
    sort = SORT_MAP.relevance;
  } else if (sortKey && SORT_MAP[sortKey] && sortKey !== "relevance") {
    sort = SORT_MAP[sortKey];
  } else if (sortKey === "relevance" && !useTextScore) {
    sort = SORT_MAP.newest;
  }

  const limitRawN = parseInt(limitRaw, 10);
  const paginate = !!(pageRaw || limitRaw);
  const limit = Math.min(100, Math.max(1, limitRawN || 20));
  const page = paginate ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;
  const skip = paginate ? (page - 1) * limit : 0;

  return { filter, sort, useTextScore, paginate, page, limit, skip };
}

async function listCourts(q) {
  const { filter, sort, useTextScore, paginate, page, limit, skip } = buildCourtListOptions(q);

  let query = Court.find(filter).populate("provider", "name email").sort(sort);

  if (useTextScore) {
    query = query.select({ score: { $meta: "textScore" } });
  }

  if (paginate) {
    const [courts, total] = await Promise.all([
      query.skip(skip).limit(limit).lean(),
      Court.countDocuments(filter),
    ]);
    return {
      courts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  const courts = await query.lean();
  return courts;
}

module.exports = {
  buildCourtListOptions,
  listCourts,
  SORT_KEYS: Object.keys(SORT_MAP),
};
