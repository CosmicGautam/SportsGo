import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import { verifyKhalti } from "../../api/payment.api";

export default function BookingPaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your payment…");

  useEffect(() => {
    let isMounted = true;

    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const pidx = searchParams.get("pidx");
    const bookingId = searchParams.get("bookingId");
    const isCancelled = ["cancel", "canceled", "failed", "error"].includes((status || "").toLowerCase());

    const redirectWithMessage = (text, delay = 1200) => {
      if (!isMounted) return;
      setMessage(text);
      setTimeout(() => {
        if (isMounted) navigate("/my-bookings", { replace: true });
      }, delay);
    };

    if (isCancelled) {
      redirectWithMessage("Payment was cancelled or failed. You can try again from My Bookings.", 2500);
      return;
    }

    const verifyPayment = async (attemptsLeft = 3) => {
      if (provider !== "khalti") {
        redirectWithMessage("Payment successful. Redirecting…", 800);
        return;
      }

      try {
        const payload = {};
        if (bookingId) payload.bookingId = bookingId;
        if (pidx) payload.pidx = pidx;

        const result = await verifyKhalti(payload);

        if (result?.ok) {
          redirectWithMessage("Payment confirmed successfully! Redirecting…", 1000);
          return;
        }

        if (result?.pending && attemptsLeft > 1) {
          if (isMounted) setMessage("Payment status pending, retrying verification…");
          setTimeout(() => verifyPayment(attemptsLeft - 1), 2000);
          return;
        }

        redirectWithMessage(
          result?.message || "We couldn't confirm your payment automatically. Please check My Bookings shortly.",
          2000
        );
      } catch (err) {
        if (attemptsLeft > 1) {
          setTimeout(() => verifyPayment(attemptsLeft - 1), 2000);
        } else {
          redirectWithMessage(err?.message || "We couldn't confirm your payment yet. Please check your bookings shortly.", 2000);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
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