import { useState, useEffect } from "react";
import { getUserBookings, cancelBooking } from "../../api/booking.api";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "../../styles/booking.css";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      setSuccess("Booking cancelled successfully");
      fetchBookings(); // Refresh the list
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Cancel booking error:", err);
      setError(err.message || "Failed to cancel booking");
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

  return (
    <>


      <section className="my-bookings-page" style={{ minHeight: "70vh", padding: "2rem 0" }}>
        <div className="container">
          <h1>My Bookings</h1>

          {error && (
            <div className="alert alert-error" style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              margin: '1rem 0'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              margin: '1rem 0'
            }}>
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
              Loading your bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings" style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                You haven't made any bookings yet.
              </p>
              <a href="/courts" className="btn btn-primary">
                Browse Courts
              </a>
            </div>
          ) : (
            <div className="bookings-list" style={{ display: 'grid', gap: '1.5rem' }}>
              {bookings.map((booking) => (
                <div
                  key={booking._id}
                  className="booking-card"
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="booking-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <h3 style={{ color: '#1f2937', margin: 0 }}>
                      {booking.court?.name || "Court"}
                    </h3>
                    <span
                      className={`status ${booking.status || "confirmed"}`}
                      style={{
                        padding: '0.375rem 0.875rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: '#d1fae5',
                        color: '#065f46'
                      }}
                    >
                      {booking.status || "Confirmed"}
                    </span>
                  </div>

                  <div className="booking-details" style={{ margin: '1rem 0' }}>
                    <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                      <strong>Date:</strong> {formatDate(booking.date)}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                      <strong>Time:</strong> {booking.timeSlot}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                      <strong>Location:</strong> {booking.court?.location || "N/A"}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                      <strong>Price:</strong> NPR {booking.court?.pricePerHour || "N/A"}
                    </p>
                  </div>

                  <div className="booking-actions" style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '2px solid #e5e7eb'
                  }}>
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(booking._id)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background 0.3s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#dc2626'}
                      onMouseOut={(e) => e.target.style.background = '#ef4444'}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}