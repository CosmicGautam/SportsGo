import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBookings } from "../../api/booking.api.js";
import { getAllCourts, createCourt } from "../../api/courts.api.js";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

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
    pricePerHour: "",
    amenities: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStats();
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

  const handleCourtSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const amenitiesArray = courtForm.amenities
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await createCourt({
        name: courtForm.name,
        location: courtForm.location,
        pricePerHour: Number(courtForm.pricePerHour),
        amenities: amenitiesArray
      });

      setSuccess("Court added successfully!");
      setCourtForm({ name: "", location: "", pricePerHour: "", amenities: "" });
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
                    placeholder="e.g., Kathmandu, Nepal"
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