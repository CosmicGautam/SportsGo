import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBookings } from "../../api/booking.api.js";
import { getAllCourts, createCourt } from "../../api/courts.api.js";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
  getAllPaymentInformation,
  verifyPaymentInformation,
  rejectPaymentInformation,
} from "../../api/payment.api.js";
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalCourts: 0,
    upcomingBookings: 0
  });
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [courtForm, setCourtForm] = useState({
    name: "",
    location: "",
    sport: "",
    pricePerHour: "",
    amenities: "",
    thumbnail: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [providers, setProviders] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPaymentInformation();
  }, []);

  const fetchStats = async () => {
    try {
      const [bookingsData, courtsData] = await Promise.all([
        getAllBookings(),
        getAllCourts()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookingsData.filter(b => 
        b.date.split('T')[0] === today
      ).length;

      const upcomingBookings = bookingsData.filter(b => 
        new Date(b.date) >= new Date(today)
      ).length;

      setStats({
        totalBookings: bookingsData.length,
        todayBookings,
        totalCourts: courtsData.length,
        upcomingBookings
      });
    } catch (err) {
      console.error("Fetch stats error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentInformation = async () => {
    try {
      setPaymentLoading(true);

      const data = await getAllPaymentInformation();

      setProviders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load payment information");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleVerify = async (userId) => {
    try {
      await verifyPaymentInformation(userId);

      setSuccess("Provider verified successfully.");

      fetchPaymentInformation();
    } catch (err) {
      setError(err.message || "Failed to verify provider");
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectPaymentInformation(userId);

      setSuccess("Provider rejected.");

      fetchPaymentInformation();
    } catch (err) {
      setError(err.message || "Failed to reject provider");
    }
  };

  const handleCourtSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  try {
    const amenitiesArray = courtForm.amenities
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const formData = new FormData();
    formData.append('name', courtForm.name);
    formData.append('location', courtForm.location);
    formData.append('sport', courtForm.sport);
    formData.append('pricePerHour', Number(courtForm.pricePerHour));
    formData.append('amenities', JSON.stringify(amenitiesArray));
    formData.append('thumbnail', courtForm.thumbnail); // file object

    await createCourt(formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setSuccess("Court added successfully!");
    setCourtForm({
      name: "",
      location: "",
      sport: "",
      pricePerHour: "",
      amenities: "",
      thumbnail: ""
    });
    setShowAddCourt(false);
    fetchStats();
  } catch (err) {
    console.error("Create court error:", err);
    setError(err.message || "Failed to create court");
  }
};

  if (loading) {
    return (
      <>

        <div style={{ 
          minHeight: '70vh', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          Loading dashboard...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      

      <section style={{ minHeight: "70vh", padding: "2rem 0", background: '#f9fafb' }}>
        <div className="container">
          <h1 style={{ color: '#1f2937', marginBottom: '2rem' }}>Admin Dashboard</h1>

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

          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #10b981'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                TOTAL BOOKINGS
              </h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {stats.totalBookings}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3b82f6'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                TODAY'S BOOKINGS
              </h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {stats.todayBookings}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #f59e0b'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                UPCOMING BOOKINGS
              </h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {stats.upcomingBookings}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <h3 style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                TOTAL COURTS
              </h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                {stats.totalCourts}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Quick Actions</h2>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/admin/bookings"
                style={{
                  padding: '1rem 2rem',
                  background: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'background 0.3s'
                }}
              >
                View All Bookings
              </Link>

              <button
                onClick={() => setShowAddCourt(!showAddCourt)}
                style={{
                  padding: '1rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                {showAddCourt ? 'Cancel' : 'Add New Court'}
              </button>

              <Link
                to="/courts"
                style={{
                  padding: '1rem 2rem',
                  background: '#6b7280',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'background 0.3s'
                }}
              >
                View Courts
              </Link>
            </div>
          </div>


          {/* PAYMENT VERIFICATION */}

          <div
              style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "12px",
                  marginBottom: "2rem",
                  boxShadow: "0 4px 6px rgba(0,0,0,.1)",
              }}
          >
              <h2 style={{ marginBottom: "1.5rem" }}>
                  Provider Payment Verification
              </h2>

              {paymentLoading ? (
                  <p>Loading payment information...</p>
              ) : providers.length === 0 ? (
                  <p>No providers found.</p>
              ) : (
                  <table
                      style={{
                          width: "100%",
                          borderCollapse: "collapse",
                      }}
                  >
                      <thead>
                          <tr
                              style={{
                                  background: "#f3f4f6",
                              }}
                          >
                              <th style={{ padding: "12px" }}>Provider</th>
                              <th>Business</th>
                              <th>Phone</th>
                              <th>Preferred</th>
                              <th>Status</th>
                              <th>Action</th>
                          </tr>
                      </thead>

                      <tbody>
                          {providers.map((provider) => (
                              <tr key={provider._id}>
                                  <td style={{ padding: "12px" }}>
                                      {provider.name}
                                  </td>

                                  <td>
                                      {provider.paymentContact?.businessName}
                                  </td>

                                  <td>
                                      {provider.paymentContact?.phone}
                                  </td>

                                  <td>
                                      {provider.paymentContact?.preferredProvider}
                                  </td>

                                  <td>
                                      {provider.paymentContact?.isVerified ? (
                                          <span
                                              style={{
                                                  color: "#059669",
                                                  fontWeight: 700,
                                              }}
                                          >
                                              Verified
                                          </span>
                                      ) : (
                                          <span
                                              style={{
                                                  color: "#d97706",
                                                  fontWeight: 700,
                                              }}
                                          >
                                              Pending
                                          </span>
                                      )}
                                  </td>

                                  <td>
                                      {!provider.paymentContact?.isVerified ? (
                                          <>
                                              <button
                                                  className="btn btn-primary"
                                                  onClick={() =>
                                                      handleVerify(provider._id)
                                                  }
                                              >
                                                  Verify
                                              </button>

                                              <button
                                                  className="btn btn-danger"
                                                  style={{
                                                      marginLeft: "8px",
                                                  }}
                                                  onClick={() =>
                                                      handleReject(provider._id)
                                                  }
                                              >
                                                  Reject
                                              </button>
                                          </>
                                      ) : (
                                          <button
                                              className="btn btn-secondary"
                                              onClick={() =>
                                                  handleReject(provider._id)
                                              }
                                          >
                                              Remove Verification
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
          </div>

          {/* Add Court Form */}
          {showAddCourt && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Add New Court</h2>
              
              <form onSubmit={handleCourtSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Court Name *
                  </label>
                  <input
                    type="text"
                    value={courtForm.name}
                    onChange={(e) => setCourtForm({...courtForm, name: e.target.value})}
                    placeholder="e.g., Court A"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    value={courtForm.location}
                    onChange={(e) => setCourtForm({...courtForm, location: e.target.value})}
                    placeholder="e.g., Kathmandu, Rautahat"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Type of Sport
                  </label>
                  <input
                    type="text"
                    value={courtForm.sport}
                    onChange={(e) => setCourtForm({...courtForm, sport: e.target.value})}
                    placeholder="e.g., Futsal, Basketball"
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Price per Hour (NPR) *
                  </label>
                  <input
                    type="number"
                    value={courtForm.pricePerHour}
                    onChange={(e) => setCourtForm({...courtForm, pricePerHour: e.target.value})}
                    placeholder="e.g., 2000"
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>


                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Amenities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={courtForm.amenities}
                    onChange={(e) => setCourtForm({...courtForm, amenities: e.target.value})}
                    placeholder="e.g., Floodlights, Changing Room, Parking"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label
                    style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}
                  >
                    Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*" // restrict to images
                    onChange={(e) =>
                      setCourtForm({...courtForm, thumbnail: e.target.files[0],
                      })
                    }
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '1rem 2rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Create Court
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}