import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";
import { 
  getSlots, 
  createBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking
} from "../controllers/booking.controller.js";

const router = express.Router();

// Public routes
router.get("/slots", getSlots);

//auth required
router.post("/", protect, createBooking);
router.get("/user", protect, getUserBookings);
router.delete("/:id", protect, cancelBooking);

// Admin only routes
router.get("/all", protect, isAdmin, getAllBookings);

export default router;