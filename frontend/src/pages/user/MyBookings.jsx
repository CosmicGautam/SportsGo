import { useState, useEffect } from "react";
import { getUserBookings, cancelBooking } from "../../api/booking.api";
import { initiateKhalti } from "../../api/payment.api";
import Footer from "../../components/layout/Footer";
import "../../styles/booking.css";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payBusy, setPayBusy] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUserBookings();
      setBookings(data);
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError(err.message || "Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  function isSlotExpired(bookingDate, timeSlot) {
    if (!bookingDate || !timeSlot) return true;
    const times = timeSlot.split(" - ");
    const endTimeStr = times[1] || times[0];
    const [hours, minutes] = endTimeStr.split(":").map(Number);

    const slotEnd = new Date(bookingDate);
    slotEnd.setHours(hours, minutes, 0, 0);

    return new Date() > slotEnd;
  }

  function isCancellationAllowed(bookingDate, timeSlot) {
    if (!bookingDate || !timeSlot) return false;
    const [startTime] = timeSlot.split(" - ");
    const [hours, minutes] = startTime.split(":").map(Number);

    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const hoursDifference = (startDateTime - new Date()) / (1000 * 60 * 60);

    return hoursDifference > 24;
  }

  const handleCancel = async (booking) => {
    if (!isCancellationAllowed(booking.date, booking.timeSlot)) {
      setError("Cancellations are only allowed at least 24 hours before the booked slot.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await cancelBooking(booking._id);
      setSuccess("Booking cancelled successfully");
      fetchBookings();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Cancel booking error:", err);
      setError(err.message || "Failed to cancel booking");
    }
  };

  const handlePayKhalti = async (bookingId) => {
    setPayBusy(bookingId);
    setError("");
    try {
      const { payment_url: paymentUrl } = await initiateKhalti(bookingId);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      setError(err?.message || "Could not start Khalti");
    } finally {
      setPayBusy(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const locationLine = (court) => {
    if (!court) return "N/A";
    if (court.district && court.address) return `${court.district}, ${court.address}`;
    return court.district || court.address || "N/A";
  };

  // Check both paymentStatus and status safely
  const isPaid = (b) => b.paymentStatus === "paid" || b.paymentStatus === "completed" || b.status === "confirmed";
  const isPending = (b) => (b.status === "pending_payment" || b.paymentStatus === "pending") && !isPaid(b);
  const isCancelled = (b) => b.status === "cancelled" || b.paymentStatus === "failed";

  const statusStyle = (booking) => {
    if (isCancelled(booking)) {
      return { background: "#fee2e2", color: "#991b1b" };
    }
    if (isPaid(booking)) {
      return { background: "#d1fae5", color: "#065f46" };
    }
    if (isPending(booking)) {
      return { background: "#fef3c7", color: "#92400e" };
    }
    return { background: "#e5e7eb", color: "#374151" };
  };

  const isUpcoming = (booking) => {
    if (!booking || isCancelled(booking)) return false;
    return !isSlotExpired(booking.date, booking.timeSlot);
  };

  const isPast = (booking) => !isCancelled(booking) && !isUpcoming(booking);

  const sortBookings = (list) =>
    [...list].sort((a, b) => {
      if (isPending(a) && !isPending(b)) return -1;
      if (!isPending(a) && isPending(b)) return 1;
      return new Date(a.date) - new Date(b.date);
    });

  const upcomingBookings = sortBookings(bookings.filter(isUpcoming));
  const pastBookings = sortBookings(bookings.filter(isPast));
  const cancelledBookings = sortBookings(bookings.filter(isCancelled));

  const renderBookingCard = (booking) => (
    <div
      key={booking._id}
      className="booking-card"
      style={{
        background: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="booking-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          paddingBottom: "1rem",
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <h3 style={{ color: "#1f2937", margin: 0 }}>{booking.court?.name || "Court"}</h3>
        <span
          className="status"
          style={{
            padding: "0.375rem 0.875rem",
            borderRadius: "20px",
            fontSize: "0.875rem",
            fontWeight: "600",
            textTransform: "uppercase",
            ...statusStyle(booking),
          }}
        >
          {isPaid(booking)
            ? "Paid & Confirmed"
            : isPending(booking)
            ? "Awaiting payment"
            : isCancelled(booking)
            ? "Cancelled"
            : booking.status}
        </span>
      </div>

      <div className="booking-details" style={{ margin: "1rem 0" }}>
        <p style={{ margin: "0.5rem 0", color: "#374151" }}>
          <strong>Date:</strong> {formatDate(booking.date)}
        </p>
        <p style={{ margin: "0.5rem 0", color: "#374151" }}>
          <strong>Time:</strong> {booking.timeSlot}
        </p>
        <p style={{ margin: "0.5rem 0", color: "#374151" }}>
          <strong>Location:</strong> {locationLine(booking.court)}
        </p>
        <p style={{ margin: "0.5rem 0", color: "#374151" }}>
          <strong>Price:</strong> NPR {booking.court?.pricePerHour ?? booking.totalPrice ?? "N/A"}
        </p>
        {booking.paymentProvider ? (
          <p style={{ margin: "0.5rem 0", color: "#6b7280", fontSize: "0.9rem" }}>
            Payment: {booking.paymentProvider}
            {booking.paymentTxnId ? ` · ${booking.paymentTxnId}` : ""}
          </p>
        ) : null}
      </div>

      <div
        className="booking-actions"
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "2px solid #e5e7eb",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        {/* Only show payment buttons/expiration if payment is STILL pending and NOT paid */}
        {isPending(booking) && (
          (() => {
            const expired = isSlotExpired(booking.date, booking.timeSlot);
            if (expired) {
              return (
                <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.9rem", padding: "0.625rem 1.25rem" }}>
                  Payment window expired
                </span>
              );
            }

            return (
              <button
                type="button"
                className="btn btn-primary"
                disabled={payBusy === booking._id}
                onClick={() => handlePayKhalti(booking._id)}
              >
                {payBusy === booking._id ? "…" : "Pay with Khalti"}
              </button>
            );
          })()
        )}

        {/* Show Cancel option for paid/confirmed bookings */}
        {!isCancelled(booking) && !isPending(booking) && (
          (() => {
            const canCancel = isCancellationAllowed(booking.date, booking.timeSlot);
            return (
              <button
                type="button"
                className="btn-cancel"
                disabled={!canCancel}
                onClick={() => handleCancel(booking)}
                title={!canCancel ? "Cancellations allowed only 24h prior to booking" : ""}
                style={{
                  padding: "0.625rem 1.25rem",
                  background: canCancel ? "#ef4444" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: canCancel ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  opacity: canCancel ? 1 : 0.6,
                  transition: "background 0.3s",
                }}
              >
                Cancel Booking
              </button>
            );
          })()
        )}

        {isPending(booking) && (
          <button
            type="button"
            onClick={() => handleCancel(booking)}
            style={{
              padding: "0.625rem 1.25rem",
              background: "transparent",
              color: "#6b7280",
              border: "2px solid #e5e7eb",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Cancel reservation
          </button>
        )}
      </div>
    </div>
  );

  const renderSection = (title, items) => {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "1rem", color: "#1f2937" }}>{title}</h2>
        <div className="bookings-list" style={{ display: "grid", gap: "1.5rem" }}>
          {items.map(renderBookingCard)}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="my-bookings-page" style={{ minHeight: "70vh", padding: "2rem 0" }}>
        <div className="container">
          <h1>My Bookings</h1>

          {error && (
            <div
              className="alert alert-error"
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "1rem",
                borderRadius: "8px",
                margin: "1rem 0",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="alert alert-success"
              style={{
                background: "#d1fae5",
                color: "#065f46",
                padding: "1rem",
                borderRadius: "8px",
                margin: "1rem 0",
              }}
            >
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading" style={{ textAlign: "center", padding: "3rem" }}>
              Loading your bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div
              className="no-bookings"
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <p style={{ fontSize: "1.2rem", color: "#6b7280", marginBottom: "1.5rem" }}>
                You haven&apos;t made any bookings yet.
              </p>
              <a href="/courts" className="btn btn-primary">
                Browse Courts
              </a>
            </div>
          ) : (
            <>
              {renderSection("Upcoming bookings", upcomingBookings)}
              {renderSection("Past bookings", pastBookings)}
              {renderSection("Cancelled bookings", cancelledBookings)}
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}