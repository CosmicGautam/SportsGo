import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/public/Home";
import Courts from "./pages/public/Courts";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Booking from "./pages/user/Booking";
import BookingPaymentReturn from "./pages/user/BookingPaymentReturn";
import BookingPaymentFailure from "./pages/user/BookingPaymentFailure";
import MyBookings from "./pages/user/MyBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllBookings from "./pages/admin/AllBookings";

import ProtectedRoute from "./components/common/ProtectedRoute";
import ProviderDashboard from "./pages/provider/ProviderDashboard";

const BOOKING_ROLES = ["user", "provider", "superadmin"];
const PROVIDER_ROLES = ["provider", "superadmin"];

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courts" element={<Courts />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/booking/:courtId"
          element={
            <ProtectedRoute allowedRoles={BOOKING_ROLES}>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/payment-return"
          element={
            <ProtectedRoute allowedRoles={BOOKING_ROLES}>
              <BookingPaymentReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/failure"
          element={
            <ProtectedRoute allowedRoles={BOOKING_ROLES}>
              <BookingPaymentFailure />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={BOOKING_ROLES}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="superadmin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider"
          element={
            <ProtectedRoute allowedRoles={PROVIDER_ROLES}>
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute role="superadmin">
              <AllBookings />
            </ProtectedRoute>
          }
        />
      </Routes>


    </>
  );
}

export default App;
