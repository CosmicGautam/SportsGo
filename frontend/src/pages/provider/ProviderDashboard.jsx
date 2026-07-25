
import { useState, useEffect, useCallback } from "react";
import {
  getMyCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  courtImageUrl,
} from "../../api/courts.api";
import { getProviderBookings } from "../../api/booking.api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/layout/Footer";
import paymentsAPI, { getPaymentInformation, updatePaymentInformation } from "../../api/payment.api";

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

  return (
    <>
      <section style={{ minHeight: "70vh", padding: "2rem 0", background: "#f9fafb" }}>
        <div className="container">

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <div>
              <h1>{isSuperAdmin ? "Court Management" : "My Courts"}</h1>
              <p>Welcome, {user?.name}</p>
            </div>
            <button onClick={openAddForm} className="btn btn-primary">+ Add Court</button>
          </div>

          {/* ALERTS */}
          {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
          {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{success}</div>}


          {/* FORM */}
          {showForm && (
            <form onSubmit={handleSubmit} style={{ background: "white", padding: "2rem", borderRadius: "12px", marginBottom: "2rem" }}>
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

          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
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
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", marginBottom: "2rem" }}>
            <h2 style={{ marginBottom: "1rem" }}>Bookings for Your Courts</h2>
            <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
              See who booked your courts, when, and whether payment is complete.
            </p>

            {providerBookingsLoading ? (
              <p>Loading bookings...</p>
            ) : providerBookings.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No bookings yet for your courts.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {providerBookings.map((booking) => (
                  <div key={booking._id} style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      <div>
                        <h3 style={{ margin: 0, color: "#111827" }}>{booking.court?.name || "Court"}</h3>
                        <p style={{ margin: "0.25rem 0 0", color: "#6b7280" }}>
                          {booking.court?.district || "—"} · {booking.court?.address || "—"}
                        </p>
                      </div>
                      <span style={{ padding: "0.35rem 0.7rem", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "600", ...bookingStatusColor(booking) }}>
                        {booking.status === "pending_payment" ? "Awaiting payment" : booking.status || "Confirmed"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", color: "#374151" }}>
                      <div>
                        <strong>Booked by</strong>
                        <p style={{ margin: "0.25rem 0 0" }}>{booking.user?.name || "Unknown"}</p>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>{booking.user?.email || "—"}</p>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>{booking.user?.phone || "—"}</p>
                      </div>
                      <div>
                        <strong>Date</strong>
                        <p style={{ margin: "0.25rem 0 0" }}>{formatDate(booking.date)}</p>
                      </div>
                      <div>
                        <strong>Time</strong>
                        <p style={{ margin: "0.25rem 0 0" }}>{booking.timeSlot || "—"}</p>
                      </div>
                      <div>
                        <strong>Payment</strong>
                        <p style={{ margin: "0.25rem 0 0" }}>{booking.paymentStatus || "pending"}</p>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>{booking.paymentProvider || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* COURT LIST */}
          {loading ? (
            <p>Loading courts...</p>
          ) : courts.length === 0 ? (
            <div style={{ background: "white", padding: "2rem", borderRadius: "12px", textAlign: "center" }}>
              <p>You haven't added any courts yet.</p>
              <button onClick={openAddForm} className="btn btn-primary">Add Your First Court</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              {courts.map((court) => (
                <div key={court._id} style={{ background: "white", borderRadius: "12px", padding: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                  <img
                    src={courtImageUrl(court.image) || "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e"}
                    alt={court.name}
                    style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginBottom: "0.5rem" }}
                  />
                  <h3>{court.name}</h3>
                  <p>{court.type} · {court.district}</p>
                  <p>NPR {court.pricePerHour}/hr</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
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