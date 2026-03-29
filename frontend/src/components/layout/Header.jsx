import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/");
    }
  };

  return (
    <header className="header" style={{
      background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div className="header-content" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" className="logo">
            <h1 style={{ 
              color: '#10b981', 
              fontSize: '1.5rem',
              margin: 0 
            }}>
              SportsGo
            </h1>
          </Link>

          <nav className="nav" style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center'
          }}>
            <Link to="/" style={linkStyle}>Home</Link>
            <Link to="/courts" style={linkStyle}>Courts</Link>
            <Link to="/about" style={linkStyle}>About</Link>
            <Link to="/contact" style={linkStyle}>Contact</Link>

            {user ? (
              <>
                <Link to="/my-bookings" style={linkStyle}>My Bookings</Link>
                {(user.role === "provider" || user.role === "superadmin") && (
                  <Link to="/provider" style={linkStyle}>Provider</Link>
                )}
                {user.role === "superadmin" && (
                  <Link to="/admin" style={linkStyle}>Admin</Link>
                )}

                <div className="user-menu" style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <span className="user-name" style={{
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {user.name || user.email || "User"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-logout"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'background 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#dc2626'}
                    onMouseOut={(e) => e.target.style.background = '#ef4444'}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-login"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    background: 'transparent',
                    border: '2px solid #10b981',
                    color: '#10b981',
                    textDecoration: 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-register"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    background: '#10b981',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'background 0.3s'
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

const linkStyle = {
  textDecoration: 'none',
  color: '#1f2937',
  fontWeight: '500',
  transition: 'color 0.3s'
};