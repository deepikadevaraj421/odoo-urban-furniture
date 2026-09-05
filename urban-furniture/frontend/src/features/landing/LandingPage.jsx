import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { ROUTES } from '../../utils/constants';
import heroImg from '../../assets/hero_furniture.png';
import aboutImg from '../../assets/about_furniture.png';


const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="hero-section" id="hero" aria-label="Hero">
        <div className="hero-bg">
          <img
            src={heroImg}
            alt="Premium modern living room with sofa and furniture"
            loading="eager"
          />
        </div>
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content">
          <p className="hero-eyebrow" aria-label="Tagline">
            Furniture for a Better Tomorrow
          </p>

          <h1 className="hero-heading">
            Modern Furniture<br />
            for <span className="accent-text">Modern Living</span>
          </h1>

          <p className="hero-subtext">
            Quality furniture for homes, offices, and modern spaces.<br />
            Built with comfort, designed for life.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-hero-primary"
              onClick={() => navigate(ROUTES.LOGIN)}
              aria-label="Explore products — go to ERP login"
            >
              Explore Products →
            </button>
            <button
              className="btn-hero-secondary"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Learn more about Urban Furniture"
            >
              Learn More
            </button>
          </div>

          {/* Trust indicators */}
          <div className="hero-trust" role="list" aria-label="Key value indicators">
            {[
              { icon: '👥', value: '500+', desc: 'Happy Customers' },
              { icon: '✦',  value: 'Premium', desc: 'Quality Assurance' },
              { icon: '🌿', value: 'Sustainable', desc: 'Eco Friendly' },
              { icon: '🕐', value: '24/7', desc: 'Support' },
            ].map((item) => (
              <div className="trust-item" key={item.value} role="listitem">
                <div className="trust-icon" aria-hidden="true">{item.icon}</div>
                <div>
                  <div className="trust-label">{item.value}</div>
                  <div className="trust-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="hero-indicators" aria-hidden="true">
          <span className="active">01</span>
          <span>02</span>
          <span>03</span>
        </div>
      </section>

      {/* ─── ABOUT / WHY US ─── */}
      <section className="about-section" id="about" aria-labelledby="about-heading">
        <div className="about-grid">
          {/* Text */}
          <div className="about-content">
            <p className="eyebrow">Why Choose Urban Furniture</p>
            <h2 className="about-heading" id="about-heading">
              More Than Furniture<br />A Better Way to Live
            </h2>
            <p className="about-desc">
              We craft spaces that inspire with modern designs, premium quality, and lasting comfort.
              Every piece is thoughtfully designed to elevate your everyday living experience.
            </p>

            <div className="feature-list">
              {[
                { icon: '🎨', title: 'Modern Design',   desc: 'Stylish furniture crafted for every contemporary space.' },
                { icon: '🪑', title: 'Premium Quality', desc: 'Built to last with carefully sourced materials.' },
                { icon: '🏠', title: 'Wide Range',      desc: 'Furniture for home, office, and commercial spaces.' },
                { icon: '💬', title: 'Customer First',  desc: 'Your satisfaction and experience is our top priority.' },
              ].map((f) => (
                <div className="feature-item" key={f.title}>
                  <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                  <div className="feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate(ROUTES.LOGIN)}
              id="about-cta"
              aria-label="Explore our products — go to ERP"
            >
              Explore Our Products →
            </button>
          </div>

          {/* Image */}
          <div className="about-image-wrapper">
            <div className="about-image-container">
              <img
                src={aboutImg}
                alt="Premium furniture showroom interior with armchair and wooden shelving"
                loading="lazy"
              />
            </div>
            <div className="about-image-badge" aria-label="500 happy customers">
              <div className="badge-number">500+</div>
              <div className="badge-label">Happy<br />Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS (anchor) ─── */}
      <section id="products" style={{ padding: '80px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Our Collection</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Curated for Modern Living
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.7' }}>
            From living rooms to executive offices, our collection blends style, comfort, and durability.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { icon: '🛋️', name: 'Living Room', desc: 'Sofas, armchairs, coffee tables' },
              { icon: '🛏️', name: 'Bedroom',     desc: 'Beds, wardrobes, nightstands' },
              { icon: '💼', name: 'Office',      desc: 'Desks, ergonomic chairs, shelves' },
              { icon: '🪴', name: 'Outdoor',     desc: 'Garden sets, loungers, planters' },
            ].map((cat) => (
              <div
                key={cat.name}
                className="card card-hover"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => navigate(ROUTES.LOGIN)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.LOGIN)}
                aria-label={`Browse ${cat.name} furniture`}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '14px' }}>{cat.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{cat.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY US (stats) ─── */}
      <section id="why-us" style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Why Urban Furniture</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '48px' }}>
            The Numbers Speak for Themselves
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
            {[
              { value: '500+',  label: 'Happy Customers' },
              { value: '1200+', label: 'Products Sold' },
              { value: '10+',   label: 'Years Experience' },
              { value: '98%',   label: 'Satisfaction Rate' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ padding: '80px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>Get in Touch</p>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Visit Our Showroom
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7', marginBottom: '36px' }}>
            Experience our premium furniture collection in person. Our team is ready to help you
            find the perfect pieces for your space.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            {[
              { icon: '📍', label: 'Location', value: 'Chennai, Tamil Nadu' },
              { icon: '📞', label: 'Phone',    value: '+91 98765 43210' },
              { icon: '✉️', label: 'Email',    value: 'info@urbanfurniture.in' },
            ].map((c) => (
              <div key={c.label} className="card" style={{ flex: '1', minWidth: '160px', textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{c.icon}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{c.value}</div>
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(ROUTES.LOGIN)}
            aria-label="Access the Urban Furniture ERP portal"
          >
            Access ERP Portal →
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon" style={{ width: '28px', height: '28px', fontSize: '0.75rem', borderRadius: '7px' }}>UF</div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Urban Furniture</span>
          </div>
          <p className="footer-copy">© 2026 Urban Furniture. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Premium Furniture ERP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
