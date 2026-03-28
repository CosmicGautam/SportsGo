import "../../styles/contact.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! Your message has been sent.");
  };

  return (
    <>


      {/* HERO */}
      <section className="contact-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We’d love to hear from you — on and off the pitch</p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section">
        <div className="container contact-grid">

          {/* INFO */}
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p>
              Have questions about bookings, courts, or partnerships?
              Reach out and our team will respond quickly.
            </p>

            <div className="info-item">
              <span>📍</span>
              <p>Ward 3, Singha Durbar, Kathmandu</p>
            </div>

            <div className="info-item">
              <span>📞</span>
              <p>+977 98XXXXXXXX</p>
            </div>

            <div className="info-item">
              <span>✉️</span>
              <p>info@futsalgo.com</p>
            </div>
          </div>

          {/* FORM */}
          <div className="contact-form-wrapper">
            <h2>Send a Message</h2>

            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                required
              />

              <textarea
                placeholder="Your Message"
                rows="5"
                required
              />

              <button className="btn btn-primary">
                Send Message
              </button>
            </form>
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}
