import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/login.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Call the API
      const data = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      console.log("Registration successful:", data);

      authLogin(data);

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/courts");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      
      {/* HERO */}
      <section className="auth-hero">
        <div className="container">
          <h1>Register</h1>
          <p>Create your account and start booking courts</p>
        </div>
      </section>

      {/* FORM */}
      <section className="auth-section">
        <div className="container auth-wrapper">
          <div className="auth-card">
            <h2>Create Account</h2>

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
                type="text"
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <button 
                className="btn btn-primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <a href="/login">Login</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}