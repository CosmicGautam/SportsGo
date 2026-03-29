// src/pages/courts/Courts.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getAllCourts } from "../../api/courts.api";
import "../../styles/courts.css";
import Footer from "../../components/layout/Footer";

const COURT_TYPES = ["All", "Futsal", "Basketball", "Volleyball", "Tennis", "Badminton"];
const DISTRICTS   = [
  "All", "Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Chitwan",
  "Butwal", "Biratnagar", "Dharan", "Birgunj", "Hetauda",
];
const PRICE_RANGES = [
  { label: "Any price",        min: "",    max: ""    },
  { label: "Under NPR 1,000",  min: "",    max: 999   },
  { label: "NPR 1,000 – 2,000",min: 1000, max: 2000  },
  { label: "NPR 2,000 – 3,500",min: 2001, max: 3500  },
  { label: "Above NPR 3,500",  min: 3501, max: ""    },
];

const DEFAULT_FILTERS = {
  type:       "All",
  district:   "All",
  priceRange: 0,      // index into PRICE_RANGES
  search:     "",
};

export default function Courts() {
  const navigate = useNavigate();
  const [courts,       setCourts]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [sidebarOpen,  setSidebarOpen]  = useState(false); // mobile toggle
  const [animating,    setAnimating]    = useState(false);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError("");
    setAnimating(true);
    try {
      const range = PRICE_RANGES[filters.priceRange];
      const data = await getAllCourts({
        type:       filters.type,
        district:   filters.district,
        minPrice:   range.min,
        maxPrice:   range.max,
        search:     filters.search,
      });
      setCourts(data);
    } catch (err) {
      setError("Failed to load courts. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 150);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchCourts, filters.search ? 400 : 0);
    return () => clearTimeout(debounce);
  }, [fetchCourts]);

  const setFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.type !== "All" ||
    filters.district !== "All" ||
    filters.priceRange !== 0 ||
    filters.search !== "";

  const handleBookCourt = (courtId) => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      alert("Please login to book a court");
      navigate("/login");
      return;
    }
    navigate(`/booking/${courtId}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="courts-hero">
        <div className="container">
          <h1>Our Courts</h1>
          <p>World-class courts designed for speed, precision, and passion.</p>
        </div>
      </section>

      {/* SEARCH BAR */}
      <div className="courts-searchbar-wrapper">
        <div className="container">
          <div className="courts-searchbar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, description or area..."
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="courts-search-input"
            />
            {filters.search && (
              <button className="search-clear" onClick={() => setFilter("search", "")}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <section className="courts-section">
        <div className="container courts-layout">

          {/* ── FILTER SIDEBAR ─────────────────────────── */}
          <aside className={`courts-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
            <div className="sidebar-header">
              <h3>Filters</h3>
              {hasActiveFilters && (
                <button className="reset-filters" onClick={resetFilters}>
                  Clear all
                </button>
              )}
            </div>

            {/* Sport Type */}
            <div className="filter-group">
              <label className="filter-group-label">Sport Type</label>
              <div className="filter-pills">
                {COURT_TYPES.map((type) => (
                  <button
                    key={type}
                    className={`filter-pill${filters.type === type ? " active" : ""}`}
                    onClick={() => setFilter("type", type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* District */}
            <div className="filter-group">
              <label className="filter-group-label">District</label>
              <div className="select-wrapper">
                <select
                  className="court-type-select"
                  value={filters.district}
                  onChange={(e) => setFilter("district", e.target.value)}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="select-arrow">▾</span>
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label className="filter-group-label">Price per Hour</label>
              <div className="filter-radio-list">
                {PRICE_RANGES.map((range, i) => (
                  <label key={i} className={`filter-radio${filters.priceRange === i ? " active" : ""}`}>
                    <input
                      type="radio"
                      name="priceRange"
                      checked={filters.priceRange === i}
                      onChange={() => setFilter("priceRange", i)}
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* ── COURTS GRID ───────────────────────────── */}
          <div className="courts-main">
            {/* Results bar */}
            <div className="courts-results-bar">
              <span className="courts-count">
                {loading ? "Loading..." : `${courts.length} court${courts.length !== 1 ? "s" : ""} found`}
              </span>
              <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen((o) => !o)}
              >
                {sidebarOpen ? "Hide Filters" : "Filters"} ⚙️
              </button>
            </div>

            {error && <p className="courts-error">{error}</p>}

            {loading ? (
              <div className="courts-loading">
                {[1, 2, 3].map((n) => <div key={n} className="court-card-skeleton" />)}
              </div>
            ) : courts.length === 0 ? (
              <div className="no-courts">
                <p>No courts match your filters.</p>
                {hasActiveFilters && (
                  <button className="btn btn-primary" onClick={resetFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`courts-grid${animating ? " courts-grid--fading" : ""}`}>
                {courts.map((court) => (
                  <div key={court._id} className="court-card">
                    <div className="court-image-wrapper">
                      <img
                        src={court.image || "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e"}
                        alt={court.name}
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e";
                        }}
                      />
                      <span className="court-type-badge">{court.type}</span>
                    </div>
                    <div className="court-info">
                      <h3>{court.name}</h3>
                      <p className="court-district">📍 {court.district}{court.address ? `, ${court.address}` : ""}</p>
                      <p>{court.description}</p>
                      {court.amenities?.length > 0 && (
                        <div className="court-amenities">
                          {court.amenities.slice(0, 3).map((a, i) => (
                            <span key={`${a}-${i}`} className="amenity-tag">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="court-meta">
                        <span>⏱ 1 Hour Slots</span>
                        <span>💰 NPR {court.pricePerHour}</span>
                      </div>
                      <button
                        onClick={() => handleBookCourt(court._id)}
                        className="btn btn-primary"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}