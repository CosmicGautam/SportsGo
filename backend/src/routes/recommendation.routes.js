const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { scoreCourtsForUser } = require("../services/recommendation/contentBased");

// GET /api/recommendations/courts?limit=10
router.get("/courts", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);
    const rows = await scoreCourtsForUser(req.user._id, { limit: limit || 10 });
    res.json(rows);
  } catch (err) {
    console.error("Recommendations:", err);
    res.status(500).json({ message: "Failed to load recommendations" });
  }
});

module.exports = router;
