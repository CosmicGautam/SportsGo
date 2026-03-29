import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourtById, courtImageUrl } from "../../api/courts.api";
import { getSlots, createBooking } from "../../api/booking.api";
import { initiateKhalti, initiateEsewa, submitEsewaForm } from "../../api/payment.api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/booking.css";
import Footer from "../../components/layout/Footer";

export default function Booking() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [court, setCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingBooking, setPendingBooking] = useState(null);
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const data = await getCourtById(courtId);
        setCourt(data);
      } catch (err) {
        console.error("Fetch court error:", err);
        setError("Failed to load court details");
      }
    };

    if (courtId) {
      fetchCourt();
    }
  }, [courtId]);

  useEffect(() => {
    if (courtId && selectedDate) {
      fetchSlots();
    }
  }, [courtId, selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    setError("");
    setSelectedSlot(null);

    try {
      const data = await getSlots(courtId, selectedDate);
      setSlots(data);
    } catch (err) {
      console.error("Fetch slots error:", err);
      setError("Failed to load time slots");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePendingBooking = async (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot) {
      setError("Please select date and time slot");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setPendingBooking(null);

    try {
      const body = await createBooking({
        courtId,
        date: selectedDate,
        time: selectedSlot,
      });

      const booking = body.booking || body;
      setPendingBooking(booking);
      setSuccess("Slot held. Complete payment below to confirm.");
      await fetchSlots();
    } catch (err) {
      console.error("Create booking error:", err);
      const msg =
        typeof err === "object" && err !== null && err.message
          ? err.message
          : "Failed to create booking. Please try again.";
      if (String(msg).toLowerCase().includes("booked")) {
        setError("This slot is already booked. Please choose another time.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKhaltiPay = async () => {
    if (!pendingBooking?._id) return;
    setPayBusy(true);
    setError("");
    try {
      const { payment_url: paymentUrl } = await initiateKhalti(pendingBooking._id);
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      setError("No payment URL returned.");
    } catch (err) {
      const msg = err?.message || "Khalti could not start. Check server keys (KHALTI_SECRET_KEY).";
      setError(msg);
    } finally {
      setPayBusy(false);
    }
  };

  const handleEsewaPay = async () => {
    if (!pendingBooking?._id) return;
    setPayBusy(true);
    setError("");
    try {
      const data = await initiateEsewa(pendingBooking._id);
      if (!data.configured && data.message) {
        setError(data.message);
        return;
      }
      if (data.actionUrl && data.fields) {
        submitEsewaForm(data.actionUrl, data.fields);
        return;
      }
      setError("eSewa is not configured.");
    } catch (err) {
      const msg =
        err?.message || "eSewa could not start. Set ESEWA_* environment variables or use Khalti.";
      setError(msg);
    } finally {
      setPayBusy(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const locationLabel =
    court?.district && court?.address
      ? `${court.district}, ${court.address}`
      : court?.district || court?.address || "—";

  const heroImage = court ? courtImageUrl(court.image) : "";

  return (
    <>
      <section className="booking-hero">
        <div className="container">
          <h1>Book Your Court</h1>
          {court && (
            <div style={{ marginTop: "1rem" }}>
              <h2 style={{ color: "#10b981", fontSize: "1.5rem" }}>{court.name}</h2>
              <p>
                {locationLabel} · NPR {court.pricePerHour}/hour
              </p>
              {heroImage ? (
                <img
                  src={heroImage}
                  alt=""
                  style={{
                    marginTop: "0.75rem",
                    maxWidth: "280px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="booking-section">
        <div className="container booking-wrapper">
          {error && (
            <div
              className="booking-card"
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="booking-card"
              style={{
                background: "#d1fae5",
                color: "#065f46",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              {success}
            </div>
          )}

          <div className="booking-card">
            <h3>Select Date</h3>
            <input
              type="date"
              value={selectedDate}
              min={getMinDate()}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
                setPendingBooking(null);
                setSuccess("");
              }}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                fontSize: "1rem",
              }}
            />
          </div>

          <div className="booking-card">
            <h3>Available Time Slots</h3>

            {!selectedDate ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>Please select a date first</p>
            ) : loading && !slots.length ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                Loading available slots...
              </p>
            ) : slots.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
                No slots available for this date
              </p>
            ) : (
              <div className="slots-grid">
                {slots.map((slot, index) => {
                  const isBooked = slot.booked;
                  const isSelected = slot.time === selectedSlot;

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={isBooked}
                      className={`slot 
                        ${isBooked ? "booked" : ""}
                        ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedSlot(slot.time);
                        setPendingBooking(null);
                        setSuccess("");
                      }}
                      style={{
                        padding: "1rem",
                        border: isSelected ? "3px solid #10b981" : "2px solid #e5e7eb",
                        borderRadius: "8px",
                        background: isBooked ? "#f3f4f6" : isSelected ? "#d1fae5" : "white",
                        cursor: isBooked ? "not-allowed" : "pointer",
                        opacity: isBooked ? 0.5 : 1,
                        fontWeight: "600",
                        transition: "all 0.3s",
                      }}
                    >
                      {slot.time}
                      {isBooked && (
                        <div style={{ fontSize: "0.75rem", color: "#ef4444" }}>Booked</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="booking-card">
            <h3>Booking Summary</h3>

            <div style={{ marginBottom: "1.5rem" }}>
              <p>
                <strong>Court:</strong> {court?.name || "Loading..."}
              </p>
              <p>
                <strong>Location:</strong> {court ? locationLabel : "Loading..."}
              </p>
              <p>
                <strong>Date:</strong> {selectedDate || "Not selected"}
              </p>
              <p>
                <strong>Time:</strong> {selectedSlot || "Not selected"}
              </p>
              <p>
                <strong>Price:</strong> NPR {court?.pricePerHour || "0"}
              </p>
              <p>
                <strong>Player:</strong> {user?.name || user?.email || "You"}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreatePendingBooking}
              disabled={!selectedDate || !selectedSlot || loading}
              style={{
                width: "100%",
                padding: "1rem",
                background: !selectedDate || !selectedSlot || loading ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: !selectedDate || !selectedSlot || loading ? "not-allowed" : "pointer",
                transition: "background 0.3s",
              }}
            >
              {loading ? "Processing..." : "Continue to payment"}
            </button>

            {pendingBooking && (
              <div style={{ marginTop: "1.25rem" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Pay with</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={payBusy}
                    onClick={handleKhaltiPay}
                    style={{ flex: "1 1 140px" }}
                  >
                    Khalti
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={payBusy}
                    onClick={handleEsewaPay}
                    style={{ flex: "1 1 140px" }}
                  >
                    eSewa
                  </button>
                </div>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.75rem" }}>
                  You will be redirected to your wallet. After paying, you will return here to confirm the booking.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/courts")}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "1rem",
                background: "transparent",
                color: "#6b7280",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Back to Courts
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
