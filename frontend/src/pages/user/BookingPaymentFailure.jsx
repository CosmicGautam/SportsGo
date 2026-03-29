import { Link } from "react-router-dom";
import Footer from "../../components/layout/Footer";

export default function BookingPaymentFailure() {
  return (
    <>
      <section style={{ minHeight: "50vh", padding: "3rem 1rem", textAlign: "center" }}>
        <div className="container">
          <h1>Payment cancelled</h1>
          <p style={{ color: "#4b5563", marginTop: "1rem", maxWidth: 480, margin: "1rem auto" }}>
            The wallet payment was not completed. Any pending reservation may still appear in My Bookings until you cancel it or complete payment.
          </p>
          <Link to="/my-bookings" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
            My Bookings
          </Link>
          <Link to="/courts" className="btn btn-secondary" style={{ display: "inline-block", marginTop: "1rem", marginLeft: "0.5rem" }}>
            Browse courts
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
