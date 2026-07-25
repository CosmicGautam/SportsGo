// routes/court.routes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const Court = require("../models/Court.model");
const User = require("../models/User.model");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const { listCourts, SORT_KEYS } = require("../services/courtQuery");
const { hasBasicContact, getContact } = require("../utils/paymentContact");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

// Accept any image/* (Firefox uses image/pjpeg; phones may use avif/heic; some send empty mimetype).
const extLooksLikeImage = /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif)$/i;
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mt = (file.mimetype || "").toLowerCase();
    if (mt.startsWith("image/")) return cb(null, true);
    if (!mt && extLooksLikeImage.test(file.originalname || "")) return cb(null, true);
    return cb(new Error("Upload must be an image file (or omit the file field)"));
  },
});

function courtImageUpload(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : err.message || "Image upload failed";
    return res.status(400).json({ message });
  });
}

function parseAmenities(body) {
  const raw = body.amenities;
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return s.split(",").map((a) => a.trim()).filter(Boolean);
    }
  }
  return undefined;
}

function mapCreateCourtErrors(err) {
  if (!err?.errors) return err?.message || "Failed to create court";
  return Object.values(err.errors)
    .map((e) => e.message)
    .join(" ");
}

async function assertProviderHasPaymentContact(providerId) {
  const provider = await User.findById(providerId).select("role paymentContact phone");
  if (!provider || provider.role !== "provider") {
    return "Invalid court provider";
  }
  if (!hasBasicContact(getContact(provider))) {
    return "Add payment contact details (phone and wallet info) before publishing a court";
  }
  return null;
}

// ─── PUBLIC ────────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await listCourts(req.query);
    if (Array.isArray(result)) {
      return res.json(result);
    }
    return res.json({
      courts: result.courts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      sortKeys: SORT_KEYS,
    });
  } catch (err) {
    console.error("List courts:", err);
    res.status(500).json({ message: "Failed to fetch courts" });
  }
});

// ─── AUTH: provider my-courts (must be before /:id) ─────────────────────────

router.get("/provider/my-courts", protect, restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    const filter = req.user.role === "superadmin" ? {} : { provider: req.user._id };
    const courts = await Court.find(filter).populate("provider", "name email").sort({ createdAt: -1 });
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

// ─── PROVIDER + SUPERADMIN ───────────────────────────────────────────────────

router.post(
  "/",
  protect,
  restrictTo("provider", "superadmin"),
  courtImageUpload,
  async (req, res) => {
    try {
      const { providerId } = req.body;
      const name = String(req.body.name ?? "").trim();
      const type = String(req.body.type ?? "").trim();
      const description = String(req.body.description ?? "").trim();
      const district = String(req.body.district ?? "").trim();
      const address = req.body.address != null ? String(req.body.address).trim() : "";
      const priceRaw = req.body.pricePerHour;
      const pricePerHour = Number(priceRaw);

      const image = req.file?.filename || "";
      const amenities = parseAmenities(req.body) ?? [];

      if (!name) return res.status(400).json({ message: "Name is required" });
      if (!description) return res.status(400).json({ message: "Description is required" });
      if (!district) return res.status(400).json({ message: "District is required" });
      if (!Number.isFinite(pricePerHour) || pricePerHour < 0) {
        return res.status(400).json({ message: "pricePerHour must be a valid non-negative number" });
      }

      let provider = req.user._id;
      if (req.user.role === "superadmin" && providerId) {
        if (!mongoose.Types.ObjectId.isValid(providerId)) {
          return res.status(400).json({ message: "Invalid providerId" });
        }
        provider = providerId;
      }

      const paymentErr = await assertProviderHasPaymentContact(provider);
      if (paymentErr) return res.status(400).json({ message: paymentErr });

      const court = await Court.create({
        name,
        type,
        description,
        district,
        address,
        pricePerHour,
        amenities,
        image,
        provider,
      });

      res.status(201).json(court);
    } catch (err) {
      const message = err.name === "ValidationError" ? mapCreateCourtErrors(err) : err.message || "Failed to create court";
      res.status(400).json({ message });
    }
  }
);

router.put(
  "/:id",
  protect,
  restrictTo("provider", "superadmin"),
  courtImageUpload,
  async (req, res) => {
    try {
      const court = await Court.findById(req.params.id);
      if (!court) return res.status(404).json({ message: "Court not found" });

      if (req.user.role === "provider" && court.provider.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only edit your own courts" });
      }

      const allowed = ["name", "type", "description", "district", "address", "pricePerHour", "isActive"];
      allowed.forEach((field) => {
        if (req.body[field] === undefined) return;
        court[field] = field === "pricePerHour" ? Number(req.body[field]) : req.body[field];
      });

      const am = parseAmenities(req.body);
      if (am !== undefined) court.amenities = am;

      if (req.user.role === "superadmin" && req.body.providerId && mongoose.Types.ObjectId.isValid(req.body.providerId)) {
        court.provider = req.body.providerId;
      }

      if (req.file) court.image = req.file.filename;

      const activating = req.body.isActive === true || req.body.isActive === "true";
      if (activating && court.isActive === false) {
        const paymentErr = await assertProviderHasPaymentContact(court.provider);
        if (paymentErr) return res.status(400).json({ message: paymentErr });
      }

      await court.save();
      res.json(court);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to update court" });
    }
  }
);

router.delete("/:id", protect, restrictTo("provider", "superadmin"), async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: "Court not found" });

    if (req.user.role === "provider" && court.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own courts" });
    }

    await Court.findByIdAndDelete(req.params.id);
    res.json({ message: "Court deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete court" });
  }
});

module.exports = router;
