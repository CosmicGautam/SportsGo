import "../../styles/home.css";

export default function Home() {
  return (
    <>

      {/* HERO */}
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-content">
            <h1>Play. Compete. Dominate.</h1>
            <p>
              Premium courts designed for speed, skill, and passion.
            </p>
            <div className="hero-actions">
              <a href="/courts" className="btn btn-primary">
                Book a Court
              </a>
              <a href="/courts" className="btn btn-outline">
                View Courts
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="home-features">
        <div className="container">
          <h2 className="section-title">Why SportsGo?</h2>

          <div className="features-grid">
            <div className="feature-card">
              <span>⚽</span>
              <h3>FIFA Standard Courts</h3>
              <p>
                International-grade flooring and dimensions for elite play.
              </p>
            </div>

            <div className="feature-card">
              <span>⏱️</span>
              <h3>Fixed 1-Hour Slots</h3>
              <p>
                Simple, fair, and transparent booking for everyone.
              </p>
            </div>

            <div className="feature-card">
              <span>💡</span>
              <h3>Pro Lighting</h3>
              <p>
                Shadow-free LED lighting for night matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <h2>Ready to Play?</h2>
          <p>Book your slot now and own the court.</p>
          <a href="/about" className="btn btn-primary">
            Get Started
          </a>
        </div>
      </section>
    </>
  );
}
