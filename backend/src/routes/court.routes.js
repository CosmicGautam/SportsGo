import express from "express";
import { getCourts, getCourtById, createCourt } from "../controllers/court.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", getCourts);
router.get("/:id", getCourtById);
router.post("/", protect, isAdmin, createCourt);

export default router;