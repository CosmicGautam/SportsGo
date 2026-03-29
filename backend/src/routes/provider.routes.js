// routes/provider.routes.js
import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import Court from "../models/Court.model.js"; // make sure this is your Court model

const router = express.Router();

// Only providers can access these routes
router.use(protect, restrictTo("provider"));

// GET /api/provider/my-courts  — list courts added by the provider
router.get("/my-courts", async (req, res) => {
  try {
    const courts = await Court.find({ provider: req.user._id });
    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courts" });
  }
});

// POST /api/provider/courts  — create court
router.post("/courts", async (req, res) => {
  try {
    const courtData = { ...req.body, provider: req.user._id };
    const court = await Court.create(courtData);
    res.status(201).json(court);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create court" });
  }
});

// PUT /api/provider/courts/:id  — update court (only if provider owns it)
router.put("/courts/:id", async (req, res) => {
  try {
    const court = await Court.findOne({ _id: req.params.id, provider: req.user._id });
    if (!court) return res.status(403).json({ message: "You do not have permission to edit this court" });

    Object.assign(court, req.body);
    await court.save();
    res.json(court);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update court" });
  }
});

// DELETE /api/provider/courts/:id  — delete court (only if provider owns it)
router.delete("/courts/:id", async (req, res) => {
  try {
    const court = await Court.findOne({ _id: req.params.id, provider: req.user._id });
    if (!court) return res.status(403).json({ message: "You do not have permission to delete this court" });

    await court.remove();
    res.json({ message: "Court removed" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete court" });
  }
});

export default router;