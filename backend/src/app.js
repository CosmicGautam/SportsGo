import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import courtRoutes from "./routes/court.routes.js";
import paymentsAPI from "../../frontend/src/api/payment.api.js";
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Futsal Booking API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/payment", paymentsAPI);


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;