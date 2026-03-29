// controllers/court.controller.js
import Court from "../models/Court.model.js";

export const getCourts = async (req, res) => {
  try {
    const { type, district, minPrice, maxPrice, search } = req.query;

    let query = {};

    // Type filter
    if (type && type !== "All") {
      query.type = type;
    }

    // District (mapped to location in DB)
    if (district && district !== "All") {
      query.location = { $regex: district, $options: "i" };
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }

    const courts = await Court.find(query).sort({ createdAt: -1 });

    res.status(200).json(courts);
  } catch (error) {
    console.error("Get courts error:", error);
    res.status(500).json({ message: "Error fetching courts" });
  }
};