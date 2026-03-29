// routes/court.routes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const Court = require("../models/Court.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// ─── MULTER CONFIG ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});
const upload = multer({ storage });

// ─── PUBLIC ────────────────────────────────────────────────────────────────
// GET all active courts with optional filters
router.get("/", async (req, res) => {
  try {
    const { type, district, minPrice, maxPrice, search } = req.query;
    const filter = { isActive: true };

    if (type && type !== "All") filter.type = type;
    if (district && district !== "All") filter.district = district;

    if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const courts = await Court.find(filter)
      .populate("provider", "name email")
      .sort({ createdAt: -1 });

    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courts" });
  }
});

// GET court by ID
router.get("/:id", async (req, res) => {
  try {
    const court = await Court.findOne({ _id: req.params.id, isActive: true }).populate("provider", "name email");
    if (!court) return res.status(404).json({ message: "Court not found" });
    res.json(court);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PROVIDER + SUPERADMIN ────────────────────────────────────────────────

// Create court
router.post(
  "/",
  protect,
  restrictTo("provider", "superadmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, type, description, district, address, pricePerHour, amenities } = req.body;
      const image = req.file?.filename || "";

      const court = await Court.create({
        name,
        type,
        description,
        district,
        address,
        pricePerHour: Number(pricePerHour),
        amenities: JSON.parse(amenities || "[]"),
        image,
        provider: req.user._id,
      });

      res.status(201).json(court);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to create court" });
    }
  }
);

// Update court
router.put(
  "/:id",
  protect,
  restrictTo("provider", "superadmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const court = await Court.findById(req.params.id);
      if (!court) return res.status(404).json({ message: "Court not found" });

      if (req.user.role === "provider" && court.provider.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only edit your own courts" });
      }

      const allowed = ["name", "type", "description", "district", "address", "pricePerHour", "amenities", "isActive"];
      allowed.forEach((field) => {
        if (req.body[field] !== undefined) court[field] = req.body[field];
      });

      if (req.file) court.image = req.file.filename;

      await court.save();
      res.json(court);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to update court" });
    }
  }
);

// Soft-delete court
router.delete("/:id", protect, restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: "Court not found" });

    if (req.user.role === "provider" && court.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own courts" });
    }

    court.isActive = false;
    await court.save();
    res.json({ message: "Court removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete court" });
  }
});

// Get courts owned by provider
router.get("/provider/my-courts", protect, restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    const filter = req.user.role === "superadmin" ? {} : { provider: req.user._id };
    const courts = await Court.find(filter).sort({ createdAt: -1 });
    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courts" });
  }
});

module.exports = router;