import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import { verifyKhalti, verifyEsewa } from "../../api/payment.api";

export default function BookingPaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    const provider = searchParams.get("provider");
    const pidx = searchParams.get("pidx");
    const bookingId = searchParams.get("bookingId");

    (async () => {
      try {
        if (provider === "khalti" && pidx) {
          const res = await verifyKhalti(pidx);
          if (res.ok) {
            setMessage("Payment successful. Redirecting…");
            setTimeout(() => navigate("/my-bookings", { replace: true }), 800);
            return;
          }
          if (res.pending) {
            setMessage("Payment still pending. Check My Bookings in a moment.");
            setTimeout(() => navigate("/my-bookings", { replace: true }), 2000);
            return;
          }
        }

        if (provider === "esewa" && bookingId) {
          const res = await verifyEsewa({ bookingId, refId: searchParams.get("refId") || "" });
          if (res.ok) {
            setMessage("Payment recorded. Redirecting…");
            setTimeout(() => navigate("/my-bookings", { replace: true }), 800);
            return;
          }
        }

        setMessage("Could not confirm payment automatically. See My Bookings or contact support.");
        setTimeout(() => navigate("/my-bookings", { replace: true }), 2500);
      } catch (e) {
        setMessage(e?.message || "Verification failed.");
        setTimeout(() => navigate("/my-bookings", { replace: true }), 2500);
      }
    })();
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
