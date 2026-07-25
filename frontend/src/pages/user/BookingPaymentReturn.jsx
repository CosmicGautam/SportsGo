import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import { verifyKhalti } from "../../api/payment.api";

export default function BookingPaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const isCancelled = status === "cancel" || status === "canceled" || status === "failed";

    if (isCancelled) {
      setMessage("Payment was cancelled or failed. You can try again from My Bookings.");
      setTimeout(() => navigate("/my-bookings", { replace: true }), 2500);
      return;
    }

    if (provider === "khalti") {
      setMessage("Payment successful. Redirecting…");
      setTimeout(() => navigate("/my-bookings", { replace: true }), 800);
      return;
    }

    setMessage("Payment successful. Redirecting…");
    setTimeout(() => navigate("/my-bookings", { replace: true }), 800);
  }, [navigate, searchParams]);

  return (
    <>
      <section style={{ minHeight: "50vh", padding: "3rem 1rem", textAlign: "center" }}>
        <div className="container">
          <h1>Payment</h1>
          <p style={{ color: "#4b5563", marginTop: "1rem" }}>{message}</p>
        </div>
      </section>
      <Footer />
    </>
  );
}
