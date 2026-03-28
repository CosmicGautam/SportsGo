import { useState, useEffect } from "react";
import { getAllBookings, cancelBooking } from "../../api/booking.api.js";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "../../styles/booking.css";

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error("Fetch all bookings error:", err);
      setError(err.message || "Failed to load bookings");
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
      fetchBookings();
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

  const filterBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch(filter) {
      case 'today':
        return bookings.filter(b => b.date.split('T')[0] === today);
      case 'upcoming':
        return bookings.filter(b => new Date(b.date) >= new Date(today));
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings();

  return (
    <>


      <section style={{ minHeight: "70vh", padding: "2rem 0", background: '#f9fafb' }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{ color: '#1f2937', margin: 0 }}>All Bookings</h1>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === 'all' ? '#10b981' : 'white',
                  color: filter === 'all' ? 'white' : '#1f2937',
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('today')}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === 'today' ? '#10b981' : 'white',
                  color: filter === 'today' ? 'white' : '#1f2937',
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Today
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === 'upcoming' ? '#10b981' : 'white',
                  color: filter === 'upcoming' ? 'white' : '#1f2937',
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Upcoming
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {success}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
                No bookings found.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', color: '#6b7280' }}>
                Showing {filteredBookings.length} booking(s)
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem' 
              }}>
                {filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{
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
                      <span style={{
                        padding: '0.375rem 0.875rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: '#d1fae5',
                        color: '#065f46'
                      }}>
                        {booking.status || "Confirmed"}
                      </span>
                    </div>

                    <div style={{ margin: '1rem 0' }}>
                      <p style={{ margin: '0.5rem 0', color: '#374151' }}>
                        <strong>User:</strong> {booking.user?.name || booking.user?.email || "N/A"}
                      </p>
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

                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '2px solid #e5e7eb'
                    }}>
                      <button
                        onClick={() => handleCancel(booking._id)}
                        style={{
                          width: '100%',
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}