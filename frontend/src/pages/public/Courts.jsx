
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { getAllCourts, courtImageUrl } from "../../api/courts.api";
import { getCourtRecommendations } from "../../api/recommendations.api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/courts.css";

const COURT_TYPES = ["All", "Futsal", "Basketball", "Volleyball", "Tennis", "Badminton"];
const DISTRICTS = [
  "All",
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan",
  "Butwal",
  "Biratnagar",
  "Dharan",
  "Birgunj",
  "Hetauda",
];
const PRICE_RANGES = [
  { label: "Any price", min: "", max: "" },
  { label: "Under NPR 1,000", min: "", max: 999 },
  { label: "NPR 1,000 – 2,000", min: 1000, max: 2000 },
  { label: "NPR 2,000 – 3,500", min: 2001, max: 3500 },
  { label: "Above NPR 3,500", min: 3501, max: "" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "relevance", label: "Relevance (with search)" },
];

const DEFAULT_FILTERS = {
  type: "All",
  district: "All",
  priceRange: 0,
  search: "",
  sort: "newest",
};

export default function Courts() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    setError("");
    setAnimating(true);
    try {
      const range = PRICE_RANGES[filters.priceRange];
      const data = await getAllCourts({
        type: filters.type,
        district: filters.district,
        minPrice: range.min,
        maxPrice: range.max,
        search: filters.search,
        sort: filters.sort,
      });
      const list = Array.isArray(data) ? data : data.courts || [];
      setCourts(list);
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

  useEffect(() => {
    if (!isLoggedIn) {
      setRecommended([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setRecLoading(true);
      try {
        const rows = await getCourtRecommendations(6);
        if (!cancelled) setRecommended(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setRecommended([]);
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.type !== "All" ||
    filters.district !== "All" ||
    filters.priceRange !== 0 ||
    filters.search !== "" ||
    filters.sort !== "newest";

  const handleBookCourt = (courtId) => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      alert("Please login to book a court");
      navigate("/login");
      return;
    }
    navigate(`/booking/${courtId}`);
  };

  const defaultImg = "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e";

  return (
    <>
      <section className="courts-hero">
        <div className="container">
          <h1>Our Courts</h1>
          <p>World-class courts designed for speed, precision, and passion.</p>
        </div>
      </section>



      {isLoggedIn && (
        <section className="courts-section" style={{ paddingBottom: 0 }}>
          <div className="container">
            <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Recommended for you</h2>
            {recLoading ? (
              <p style={{ color: "#6b7280" }}>Loading suggestions…</p>
            ) : recommended.length === 0 ? (
              <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                Book and pay for a court to get personalized picks.
              </p>
            ) : (
              <div
                className="courts-grid"
                style={{
                  marginBottom: "2rem",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                }}
              >
                {recommended.map(({ court: c, score }, idx) => (
                  <div
                    key={c != null && c._id != null ? String(c._id) : `recommended-${idx}`}
                    className="court-card"
                  >
                    <div className="court-image-wrapper">
                      <img
                        src={courtImageUrl(c.image) || defaultImg}
                        alt={c.name}
                        onError={(e) => {
                          e.target.src = defaultImg;
                        }}
                      />
                      <span className="court-type-badge">{c.type}</span>
                    </div>
                    <div className="court-info">
                      <h3>{c.name}</h3>
                      <p className="court-district">
                        📍 {c.district}
                        {c.address ? `, ${c.address}` : ""}
                      </p>
                      {score > 0 && (
                        <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                          Match {(score * 100).toFixed(0)}%
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleBookCourt(c._id)}
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
        </section>
      )}

      <section className="courts-section">
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
                <button className="search-clear" onClick={() => setFilter("search", "")}>
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="container courts-layout">
          <aside className={`courts-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
            <div className="sidebar-header">
              <h3>Filters</h3>
              {hasActiveFilters && (
                <button className="reset-filters" onClick={resetFilters}>
                  Clear all
                </button>
              )}
            </div>

            <div className="filter-group">
              <label className="filter-group-label">Sport Type</label>
              <div className="filter-pills">
                {COURT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`filter-pill${filters.type === type ? " active" : ""}`}
                    onClick={() => setFilter("type", type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-group-label">District</label>
              <div className="select-wrapper">
                <select
                  className="court-type-select"
                  value={filters.district}
                  onChange={(e) => setFilter("district", e.target.value)}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">▾</span>
              </div>
            </div>

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

          <div className="courts-main">
            <div className="courts-results-bar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
              <span className="courts-count">
                {loading ? "Loading..." : `${courts.length} court${courts.length !== 1 ? "s" : ""} found`}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <label htmlFor="court-sort" style={{ fontSize: "0.9rem", color: "#4b5563" }}>
                  Sort
                </label>
                <select
                  id="court-sort"
                  value={filters.sort}
                  onChange={(e) => setFilter("sort", e.target.value)}
                  className="court-type-select"
                  style={{ minWidth: "200px" }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="sidebar-toggle-btn"
                  onClick={() => setSidebarOpen((o) => !o)}
                >
                  {sidebarOpen ? "Hide Filters" : "Filters"} ⚙️
                </button>
              </div>
            </div>

            {error && <p className="courts-error">{error}</p>}

            {loading ? (
              <div className="courts-loading">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="court-card-skeleton" />
                ))}
              </div>
            ) : courts.length === 0 ? (
              <div className="no-courts">
                <p>No courts match your filters.</p>
                {hasActiveFilters && (
                  <button type="button" className="btn btn-primary" onClick={resetFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`courts-grid${animating ? " courts-grid--fading" : ""}`}>
                {courts.map((court, idx) => (
                  <div
                    key={court._id != null ? String(court._id) : `court-${idx}`}
                    className="court-card"
                  >
                    <div className="court-image-wrapper">
                      <img
                        src={courtImageUrl(court.image) || defaultImg}
                        alt={court.name}
                        onError={(e) => {
                          e.target.src = defaultImg;
                        }}
                      />
                      <span className="court-type-badge">{court.type}</span>
                    </div>
                    <div className="court-info">
                      <h3>{court.name}</h3>
                      <p className="court-district">
                        📍 {court.district}
                        {court.address ? `, ${court.address}` : ""}
                      </p>
                      <p>{court.description}</p>
                      {court.amenities?.length > 0 && (
                        <div className="court-amenities">
                          {court.amenities.slice(0, 3).map((a, i) => (
                            <span
                              key={`${court._id ?? idx}-amenity-${i}-${a}`}
                              className="amenity-tag"
                            >
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
                        type="button"
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
