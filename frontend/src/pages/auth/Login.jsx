import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/login.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call the API
      const data = await login(formData.email, formData.password);

      console.log("Login successful:", data);

      // Store auth data
      authLogin(data);

      // Redirect based on role
      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/courts");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>


      {/* HERO */}
      <section className="auth-hero">
        <div className="container">
          <h1>Login</h1>
          <p>Access your bookings and dashboard</p>
        </div>
      </section>

      {/* FORM */}
      <section className="auth-section">
        <div className="container auth-wrapper">
          <div className="auth-card">
            <h2>Welcome Back</h2>

            {error && (
              <div className="error-message" style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <button 
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account? <a href="/register">Register</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}