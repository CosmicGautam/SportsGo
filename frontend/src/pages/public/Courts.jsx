import { useNavigate } from "react-router-dom";
import "../../styles/courts.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

const COURTS = [
  {
    id: "indoor-arena",
    name: "Indoor Arena",
    description: "Wooden flooring • Climate controlled",
    price: 1500,
    image: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e"
  },
  {
    id: "outdoor-pitch",
    name: "Outdoor Pitch", 
    description: "Artificial turf • Flood lights",
    price: 1200,
    image: "https://images.unsplash.com/photo-1521217078329-f8fc1becab68?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    id: "training-court",
    name: "Training Court",
    description: "Perfect for practice sessions",
    price: 1000,
    image: "https://images.unsplash.com/photo-1622862259519-f6aab1c6168a?q=80&w=1127&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

export default function Courts() {
  const navigate = useNavigate();

  const handleBookCourt = (courtId) => {
    const token = localStorage.getItem('token');
    const auth = localStorage.getItem('auth');
    
    if (!token && !auth) {
      // Not logged in, redirect to login
      alert("Please login to book a court");
      navigate('/login');
      return;
    }
    
    // Navigate to booking page with courtId
    navigate(`/booking/${courtId}`);
  };

  return (
    <>

      {/* HERO */}
      <section className="courts-hero">
        <div className="container">
          <h1>Our Futsal Courts</h1>
          <p>
            World-class courts designed for speed, precision, and passion.
          </p>
        </div>
      </section>

      {/* COURTS LIST */}
      <section className="courts-section">
        <div className="container">
          <div className="courts-grid">

            {COURTS.map((court) => (
              <div key={court.id} className="court-card">
                <img
                  src={court.image}
                  alt={court.name}
                />
                <div className="court-info">
                  <h3>{court.name}</h3>
                  <p>{court.description}</p>
                  <div className="court-meta">
                    <span>⏱ 1 Hour Slots</span>
                    <span>💰 Rs. {court.price}</span>
                  </div>
                  <button 
                    onClick={() => handleBookCourt(court.id)}
                    className="btn btn-primary"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}