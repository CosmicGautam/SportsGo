import "../../styles/about.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

export default function About() {
  return (
    <>


      {/* HERO */}
      <section className="about-hero">
        <div className="container">
          <h1>About SportsGo</h1>
          <p>Where passion meets professional sports facilities</p>
        </div>
      </section>

      {/* STORY */}
      <section className="about-section">
        <div className="container about-grid">
          <div className="about-text">
            <h2>Our Story</h2>
            <p>
              SportsGo was founded with a single mission — to create a premium,
              accessible, and professionally managed sports experience for
              players of all skill levels.
            </p>
            <p>
              From casual weekend matches to competitive leagues, our courts
              are built to international standards and maintained with
              precision.
            </p>
          </div>

          <div className="about-image">
            <img
              src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b"
              alt="Sports match"
            />
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="values-section">
        <div className="container">
          <h2 className="section-title">Our Core Values</h2>

          <div className="values-grid">
            <div className="value-card">
              <h3>⚽ Passion for the Game</h3>
              <p>
                Football is more than a sport — it is our culture. Every detail
                reflects our love for the game.
              </p>
            </div>

            <div className="value-card">
              <h3>🏟 World-Class Facilities</h3>
              <p>
                Professional surfaces, modern lighting, and safe playing
                environments.
              </p>
            </div>

            <div className="value-card">
              <h3>🤝 Community First</h3>
              <p>
                We connect players, teams, and tournaments to grow the futsal
                community together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container">
          <h2>Ready to Play?</h2>
          <p>Book your court and experience futsal at its finest.</p>
          <a href="/courts" className="btn btn-primary">
            Book Now
          </a>
        </div>
      </section>

    </>
  );
}
