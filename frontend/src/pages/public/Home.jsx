import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAllCourts, courtImageUrl } from "../../api/courts.api";
import { getUserBookings } from "../../api/booking.api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/home.css";

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [courts, setCourts] = useState([]);
  const [courtsLoading, setCourtsLoading] = useState(true);

  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Refs for smooth scroll buttons
  const courtsSliderRef = useRef(null);
  const bookingsSliderRef = useRef(null);

  const defaultImg = "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e";

  useEffect(() => {
    let cancelled = false;
    const fetchCourts = async () => {
      try {
        const data = await getAllCourts();
        const list = Array.isArray(data) ? data : data?.courts || [];
        if (!cancelled) setCourts(list);
      } catch (err) {
        console.error("Failed to load courts for homepage:", err);
      } finally {
        if (!cancelled) setCourtsLoading(false);
      }
    };

    fetchCourts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setUpcomingBookings([]);
      return;
    }

    let cancelled = false;
    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const data = await getUserBookings();
        const list = Array.isArray(data) ? data : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = list.filter((b) => {
          if (b.status === "cancelled") return false;
          const bookingDate = new Date(b.date);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate >= today;
        });

        if (!cancelled) setUpcomingBookings(upcoming);
      } catch (err) {
        console.error("Failed to fetch user bookings:", err);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    };

    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const handleBookCourt = (courtId) => {
    if (!isLoggedIn) {
      alert("Please login to book a court");
      navigate("/login");
      return;
    }
    navigate(`/booking/${courtId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const scrollSlider = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-content">
            <h1>Play. Compete. Dominate.</h1>
            <p>Premium courts designed for speed, skill, and passion.</p>
            <div className="hero-actions">
              <Link to="/courts" className="btn btn-primary">
                Book a Court
              </Link>
              <Link to="/courts" className="btn btn-outline">
                View Courts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING BOOKINGS SLIDER */}
      {isLoggedIn && (bookingsLoading || upcomingBookings.length > 0) && (
        <section className="home-slider-section upcoming-bookings-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2 className="section-title">📅 Your Upcoming Bookings</h2>
              </div>
              <div className="section-controls">
                <div className="slider-nav-btns">
                  <button
                    type="button"
                    className="slider-arrow"
                    onClick={() => scrollSlider(bookingsSliderRef, "left")}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="slider-arrow"
                    onClick={() => scrollSlider(bookingsSliderRef, "right")}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                </div>
                <Link to="/my-bookings" className="see-all-link">
                  View All →
                </Link>
              </div>
            </div>

            {bookingsLoading ? (
              <p style={{ color: "#6b7280" }}>Loading your upcoming bookings…</p>
            ) : (
              <div className="flex-slider" ref={bookingsSliderRef}>
                {upcomingBookings.map((b) => (
                  <div key={b._id} className="slider-card booking-slide-card">
                    <div className="card-header">
                      <h3>{b.court?.name || "Court"}</h3>
                      <span className={`status-badge ${b.status || "confirmed"}`}>
                        {b.status === "pending_payment" ? "Pending" : "Confirmed"}
                      </span>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>🗓 Date:</strong> {formatDate(b.date)}
                      </p>
                      <p>
                        <strong>⏱ Time:</strong> {b.timeSlot}
                      </p>
                      <p>
                        <strong>📍 Location:</strong>{" "}
                        {b.court?.district ? `${b.court.district}` : "N/A"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate("/my-bookings")}
                    >
                      Manage Booking
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* AVAILABLE COURTS SLIDER */}
      <section className="home-slider-section courts-slider-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🏆 Available Courts</h2>
            </div>
            <div className="section-controls">
              <div className="slider-nav-btns">
                <button
                  type="button"
                  className="slider-arrow"
                  onClick={() => scrollSlider(courtsSliderRef, "left")}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="slider-arrow"
                  onClick={() => scrollSlider(courtsSliderRef, "right")}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
              <Link to="/courts" className="see-all-link">
                Explore All →
              </Link>
            </div>
          </div>

          {courtsLoading ? (
            <p style={{ color: "#6b7280" }}>Loading available courts…</p>
          ) : courts.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No courts available right now.</p>
          ) : (
            <div className="flex-slider" ref={courtsSliderRef}>
              {courts.map((court) => (
                <div key={court._id} className="slider-card court-slide-card">
                  <div className="card-image-wrapper">
                    <img
                      src={courtImageUrl(court.image) || defaultImg}
                      alt={court.name}
                      onError={(e) => {
                        e.target.src = defaultImg;
                      }}
                    />
                    <span className="court-type-badge">{court.type}</span>
                  </div>
                  <div className="card-content">
                    <h3>{court.name}</h3>
                    <p className="court-district">
                      📍 {court.district}
                      {court.address ? `, ${court.address}` : ""}
                    </p>
                    <div className="court-price">
                      <span>NPR {court.pricePerHour}/hr</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBookCourt(court._id)}
                      className="btn btn-primary btn-block"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <h2>Ready to Play?</h2>
          <p>Book your slot now and own the court.</p>
          <Link to="/about" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}