import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getMyCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  courtImageUrl,
} from "../../api/courts.api";
import { getProviderBookings, updateBookingPaymentStatus } from "../../api/booking.api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/layout/Footer";
import { getPaymentInformation, updatePaymentInformation } from "../../api/payment.api";

const DISTRICTS = [
  "Kathmandu","Lalitpur","Bhaktapur","Pokhara","Chitwan",
  "Butwal","Biratnagar","Dharan","Birgunj","Hetauda",
];
const COURT_TYPES = ["Futsal","Basketball","Volleyball","Tennis","Badminton"];

const EMPTY_FORM = {
  name: "",
  type: "Futsal",
  description: "",
  district: "Kathmandu",
  address: "",
  pricePerHour: "",
  amenities: "",
  imageFile: null,
};

export default function ProviderDashboard() {
  const { user, isSuperAdmin } = useAuth();

  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerBookings, setProviderBookings] = useState([]);
  const [providerBookingsLoading, setProviderBookingsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters state
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'today' | 'upcoming'
  const [paymentFilter, setPaymentFilter] = useState("all"); // 'all' | 'completed' | 'pending' | 'failed'



  const [updatingPaymentId, setUpdatingPaymentId] = useState(null);

  const handleMarkAsPaid = async (bookingId) => {
    if (!window.confirm("Are you sure you want to manually mark this booking as PAID?")) {
      return;
    }

    try {
      setUpdatingPaymentId(bookingId);
      setError("");
      setSuccess("");

      await updateBookingPaymentStatus(bookingId, "paid");

      setSuccess("Payment status updated to Paid. Booking confirmed.");
      fetchProviderBookings();
    } catch (err) {
      setError(
        (typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : null) || "Failed to update payment status."
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  };


  const fetchCourts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyCourts();
      setCourts(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to load courts";
      setError(msg);
      setCourts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviderBookings = useCallback(async () => {
    setProviderBookingsLoading(true);
    try {
      const data = await getProviderBookings();
      setProviderBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to load bookings";
      setError((prev) => prev || msg);
      setProviderBookings([]);
    } finally {
      setProviderBookingsLoading(false);
    }
  }, []);

  // Filter logic
  const filteredBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    return providerBookings.filter((booking) => {
      const bookingDateStr = booking.date ? new Date(booking.date).toISOString().split("T")[0] : "";

      // Time Range Filter
      if (dateFilter === "today" && bookingDateStr !== todayStr) {
        return false;
      }
      if (dateFilter === "upcoming" && bookingDateStr < todayStr) {
        return false;
      }

      // Payment Status Filter
      const status = (booking.paymentStatus || booking.status || "").toLowerCase();
      if (paymentFilter === "completed" && status !== "completed" && status !== "paid") {
        return false;
      }
      if (paymentFilter === "pending" && status !== "pending" && status !== "pending_payment") {
        return false;
      }
      if (paymentFilter === "failed" && status !== "failed" && status !== "cancelled") {
        return false;
      }

      return true;
    });
  }, [providerBookings, dateFilter, paymentFilter]);

  // helper function to check if the time slot has passed
  const isSlotPassed = (bookingDate, timeSlot) => {
    const date = new Date(bookingDate);
    
    // Extract start time from slot string (e.g., "10:00 - 11:00" -> "10:00")
    let startTime = timeSlot;
    if (timeSlot.includes("-")) {
      startTime = timeSlot.split("-")[0].trim();
    }

    // Parse hours and minutes
    const timeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const ampm = timeParts[3];

      if (ampm) {
        if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
      }
      date.setHours(hours, minutes, 0, 0);
    }

    return new Date() > date;
  };  

  const [paymentInfo, setPaymentInfo] = useState({
    businessName: "",
    phone:"",
    preferredProvider: "khalti",
    khalti: {
      walletId:"",
      merchantId:"",
    },
    isVerified: false,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchCourts();
    fetchProviderBookings();
  }, [fetchCourts, fetchProviderBookings]);

  useEffect(() => {
    let mounted = true;
    (async function loadPayment() {
      setPaymentLoading(true);
      try {
        const data = await getPaymentInformation();
        if (!mounted) return;
        setPaymentInfo((prev) => ({ ...prev, ...data }));
      } catch (err) {
        setError((e) => e || (err?.message ? String(err.message) : "Failed to load payment info"));
      } finally {
        setPaymentLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPreview("");
    setEditingId(null);
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setPreview("");
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const openEditForm = (court) => {
    setForm({
      name: court.name,
      type: court.type,
      description: court.description,
      district: court.district,
      address: court.address || "",
      pricePerHour: court.pricePerHour,
      amenities: (court.amenities || []).join(", "),
      imageFile: null,
    });
    setPreview(courtImageUrl(court.image) || "");
    setEditingId(court._id);
    setShowForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, imageFile: file }));
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("type", form.type);
      formData.append("description", form.description);
      formData.append("district", form.district);
      formData.append("address", form.address ?? "");
      const priceNum = Number(form.pricePerHour);
      formData.append(
        "pricePerHour",
        Number.isFinite(priceNum) ? String(priceNum) : "0"
      );

      const amenitiesArray = form.amenities.split(",").map((a) => a.trim()).filter(Boolean);
      formData.append("amenities", JSON.stringify(amenitiesArray));

      if (form.imageFile) formData.append("image", form.imageFile);

      if (editingId) {
        await updateCourt(editingId, formData);
        setSuccess("Court updated successfully!");
      } else {
        await createCourt(formData);
        setSuccess("Court created successfully!");
      }

      resetForm();
      fetchCourts();
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to save court";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courtId, courtName) => {
    if (!window.confirm(`Delete "${courtName}"?`)) return;
    try {
      const res = await deleteCourt(courtId);
      setSuccess(res?.message || "Court deleted successfully.");
      fetchCourts();
    } catch (err) {
      setError(err.message || "Failed to delete court");
    }
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    setPaymentInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKhaltiChange = (e) => {
    const { name, value } = e.target;

    setPaymentInfo((prev) => ({
      ...prev,
      khalti: {
        ...prev.khalti,
        [name]: value,
      },
    }));
  };

  const handleSavePayment = async () => {
    try {
      setPaymentLoading(true);
      setError("");
      setSuccess("");

      const data = await updatePaymentInformation(paymentInfo);

      setSuccess(data?.message || "Payment information saved successfully.");
      if (data?.paymentContact) setPaymentInfo((p) => ({ ...p, ...data.paymentContact }));
    } catch (err) {
      const msg = typeof err === "object" && err !== null && "message" in err ? String(err.message) : "Failed to save payment information.";
      setError(msg);
    } finally {
      setPaymentLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "1rem",
  };

  const labelStyle = { fontWeight: "600", marginBottom: "0.25rem", display: "block" };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const bookingStatusColor = (booking) => {
    if (booking?.status === "pending_payment") return { color: "#92400e", background: "#fef3c7" };
    if (booking?.status === "cancelled") return { color: "#991b1b", background: "#fee2e2" };
    return { color: "#065f46", background: "#d1fae5" };
  };


  const styles = {
    page: {
      minHeight: "70vh",
      padding: "2.5rem 0 3.5rem",
      background: "#f4f7fb",
    },
    sectionCard: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "16px",
      padding: "1.5rem",
      marginBottom: "1.5rem",
      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: "1.25rem",
      marginBottom: "1.5rem",
    },
    sectionTitle: {
      margin: 0,
      color: "#0f172a",
      fontSize: "1.45rem",
      lineHeight: 1.25,
    },
    sectionSubtitle: {
      color: "#64748b",
      margin: "0.4rem 0 0",
      lineHeight: 1.5,
    },
    filterGroup: {
      display: "flex",
      gap: "0.75rem",
      flexWrap: "wrap",
      alignItems: "flex-end",
    },
    filterField: {
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      minWidth: "170px",
    },
    filterLabel: {
      fontSize: "0.78rem",
      fontWeight: "700",
      color: "#475569",
      letterSpacing: "0.02em",
    },
    filterSelect: {
      padding: "0.65rem 0.8rem",
      borderRadius: "9px",
      border: "1px solid #cbd5e1",
      background: "#fff",
      color: "#0f172a",
      fontSize: "0.92rem",
      outline: "none",
    },
    bookingList: {
      display: "grid",
      gap: "1rem",
    },
    bookingCard: {
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "1.25rem",
      background: "#fff",
      boxShadow: "0 3px 12px rgba(15, 23, 42, 0.04)",
    },
    bookingHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "1rem",
      flexWrap: "wrap",
      paddingBottom: "1rem",
      marginBottom: "1rem",
      borderBottom: "1px solid #eef2f7",
    },
    bookingTitle: {
      margin: 0,
      color: "#0f172a",
      fontSize: "1.1rem",
      lineHeight: 1.35,
    },
    bookingLocation: {
      margin: "0.3rem 0 0",
      color: "#64748b",
      fontSize: "0.9rem",
    },
    statusBadge: {
      padding: "0.45rem 0.8rem",
      borderRadius: "999px",
      fontSize: "0.78rem",
      fontWeight: "700",
      whiteSpace: "nowrap",
    },
    bookingDetails: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "0.75rem",
    },
    detailItem: {
      background: "#f8fafc",
      border: "1px solid #edf2f7",
      borderRadius: "10px",
      padding: "0.85rem",
      minWidth: 0,
    },
    detailLabel: {
      display: "block",
      color: "#64748b",
      fontSize: "0.76rem",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      marginBottom: "0.35rem",
    },
    detailValue: {
      margin: 0,
      color: "#1e293b",
      fontWeight: "600",
      lineHeight: 1.4,
    },
    detailSecondary: {
      margin: "0.15rem 0 0",
      color: "#64748b",
      fontSize: "0.86rem",
      lineHeight: 1.35,
      wordBreak: "break-word",
    },
    bookingActions: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "0.75rem",
      marginTop: "1rem",
      paddingTop: "1rem",
      borderTop: "1px solid #eef2f7",
    },
    payButton: {
      fontSize: "0.88rem",
      padding: "0.55rem 1rem",
      borderRadius: "8px",
      fontWeight: "700",
    },
    emptyState: {
      textAlign: "center",
      padding: "2.5rem 1rem",
      color: "#64748b",
    },
    courtGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1rem",
    },
    courtCard: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "1rem",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
      overflow: "hidden",
    },
    courtImage: {
      width: "100%",
      height: "165px",
      objectFit: "cover",
      borderRadius: "10px",
      marginBottom: "0.8rem",
    },
    courtActions: {
      display: "flex",
      gap: "0.5rem",
      marginTop: "1rem",
    },
  };

  return (
    <>
      <section style={styles.page}>
        <div className="container">

          {/* HEADER */}
          <div style={styles.sectionHeader}>
            <div>
              <h1 style={{ margin: 0, color: "#0f172a" }}>
                {isSuperAdmin ? "Court Management" : "My Courts"}
              </h1>
              <p style={{ margin: "0.4rem 0 0", color: "#64748b" }}>
                Welcome, {user?.name}
              </p>
            </div>
            <button onClick={openAddForm} className="btn btn-primary">
              + Add Court
            </button>
          </div>

          {/* ALERTS */}
          {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
          {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{success}</div>}

          {/* FORM */}
          {showForm && (
            <form onSubmit={handleSubmit} style={styles.sectionCard}>
              <h2>{editingId ? "Edit Court" : "Add Court"}</h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Court Name *</label>
                  <input required value={form.name} onChange={f("name")} style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Sport Type *</label>
                  <select value={form.type} onChange={f("type")} style={inputStyle}>
                    {COURT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>District *</label>
                  <select value={form.district} onChange={f("district")} style={inputStyle}>
                    {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Price per Hour *</label>
                  <input required type="number" min="0" value={form.pricePerHour} onChange={f("pricePerHour")} style={inputStyle} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Address</label>
                  <input value={form.address} onChange={f("address")} style={inputStyle} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description *</label>
                  <textarea required value={form.description} onChange={f("description")} style={{ ...inputStyle, resize: "vertical" }} rows={3} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Amenities (comma separated)</label>
                  <input value={form.amenities} onChange={f("amenities")} style={inputStyle} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Court photo</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    style={{ marginBottom: "1rem" }}
                  />
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.75rem" }}>
                    {editingId
                      ? "Upload a new image to replace the current court photo (optional)."
                      : "Upload a photo for this court listing (optional but recommended). JPEG, PNG, WebP, or GIF."}
                  </p>
                  {preview ? (
                    <img src={preview} alt="" style={{ width: "180px", maxHeight: "120px", objectFit: "cover", borderRadius: "8px" }} />
                  ) : null}
                </div>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          )}

          {/* PAYMENT INFORMATION */}
          <div style={styles.sectionCard}>
            <h2>Payment Information</h2>

            <p
              style={{
                color: paymentInfo.isVerified ? "#059669" : "#d97706",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              Status:
              {paymentInfo.isVerified
                ? " ✔ Verified"
                : " ⏳ Pending Verification"}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label style={labelStyle}>Business Name</label>

                <input
                  name="businessName"
                  value={paymentInfo.businessName}
                  onChange={handlePaymentChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>

                <input
                  name="phone"
                  value={paymentInfo.phone}
                  onChange={handlePaymentChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Preferred Provider</label>

                <select
                  name="preferredProvider"
                  value={paymentInfo.preferredProvider}
                  onChange={handlePaymentChange}
                  style={inputStyle}
                >
                  <option value="khalti">Khalti</option>
                </select>
              </div>

              <div></div>

              <div>
                <label style={labelStyle}>Khalti Wallet ID</label>

                <input
                  name="walletId"
                  value={paymentInfo.khalti.walletId}
                  onChange={handleKhaltiChange}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Khalti Merchant ID</label>

                <input
                  name="merchantId"
                  value={paymentInfo.khalti.merchantId}
                  onChange={handleKhaltiChange}
                  style={inputStyle}
                />
              </div>

            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSavePayment}
              disabled={paymentLoading}
            >
              {paymentLoading
                ? "Saving..."
                : "Save Payment Information"}
            </button>
          </div>

          {/* PROVIDER BOOKINGS */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Bookings for Your Courts</h2>
                <p style={styles.sectionSubtitle}>
                  See who booked your courts, when, and whether payment is complete.
                </p>
              </div>

              {/* Booking Filters */}
              <div style={styles.filterGroup}>
                <div style={styles.filterField}>
                  <label style={styles.filterLabel}>Time Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                <div style={styles.filterField}>
                  <label style={styles.filterLabel}>Payment Status</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="completed">Completed / Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed / Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {providerBookingsLoading ? (
              <p style={{ color: "#64748b", margin: 0 }}>Loading bookings...</p>
            ) : filteredBookings.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={{ margin: 0 }}>No bookings match the selected filters.</p>
              </div>
            ) : (
              <div style={styles.bookingList}>
                {filteredBookings.map((booking) => (
                  <div key={booking._id} style={styles.bookingCard}>
                    <div style={styles.bookingHeader}>
                      <div>
                        <h3 style={styles.bookingTitle}>
                          {booking.court?.name || "Court"}
                        </h3>
                        <p style={styles.bookingLocation}>
                          {booking.court?.district || "—"} ·{" "}
                          {booking.court?.address || "—"}
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          ...bookingStatusColor(booking),
                        }}
                      >
                        {booking.status === "pending_payment"
                          ? "Awaiting payment"
                          : booking.status || "Confirmed"}
                      </span>
                    </div>

                    <div style={styles.bookingDetails}>
                      <div style={styles.detailItem}>
                        <strong style={styles.detailLabel}>Booked by</strong>
                        <p style={styles.detailValue}>
                          {booking.user?.name || "Unknown"}
                        </p>
                        <p style={styles.detailSecondary}>
                          {booking.user?.email || "—"}
                        </p>
                        <p style={styles.detailSecondary}>
                          {booking.user?.phone || "—"}
                        </p>
                      </div>

                      <div style={styles.detailItem}>
                        <strong style={styles.detailLabel}>Date</strong>
                        <p style={styles.detailValue}>
                          {formatDate(booking.date)}
                        </p>
                      </div>

                      <div style={styles.detailItem}>
                        <strong style={styles.detailLabel}>Time</strong>
                        <p style={styles.detailValue}>
                          {booking.timeSlot || "—"}
                        </p>
                      </div>

                      <div style={styles.detailItem}>
                        <strong style={styles.detailLabel}>Payment</strong>
                        <p style={styles.detailValue}>
                          {booking.paymentStatus || "pending"}
                        </p>
                        <p style={styles.detailSecondary}>
                          {booking.paymentProvider || "—"}
                        </p>
                      </div>
                    </div>

                    {(booking.status === "pending_payment" ||
                      (booking.paymentStatus || "").toLowerCase() === "pending") &&
                      booking.status !== "cancelled" && (
                        <div style={styles.bookingActions}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={updatingPaymentId === booking._id}
                            onClick={() => handleMarkAsPaid(booking._id)}
                            style={styles.payButton}
                          >
                            {updatingPaymentId === booking._id
                              ? "Updating..."
                              : "Mark as Paid"}
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COURT LIST */}
          {loading ? (
            <p>Loading courts...</p>
          ) : courts.length === 0 ? (
            <div style={{ ...styles.sectionCard, ...styles.emptyState }}>
              <p>You haven't added any courts yet.</p>
              <button onClick={openAddForm} className="btn btn-primary">Add Your First Court</button>
            </div>
          ) : (
            <div style={styles.courtGrid}>
              {courts.map((court) => (
                <div key={court._id} style={styles.courtCard}>
                  <img
                    src={courtImageUrl(court.image) || "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e"}
                    alt={court.name}
                    style={styles.courtImage}
                  />
                  <h3>{court.name}</h3>
                  <p>{court.type} · {court.district}</p>
                  <p>NPR {court.pricePerHour}/hr</p>
                  <div style={styles.courtActions}>
                    <button className="btn btn-secondary" onClick={() => openEditForm(court)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(court._id, court.name)}>Delete</button>
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