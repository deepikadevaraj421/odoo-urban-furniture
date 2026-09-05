import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { ROUTES } from '../../utils/constants';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" aria-label="Urban Furniture home">
          <div className="brand-icon" aria-hidden="true">UF</div>
          <span className="brand-name">Urban Furniture</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="navbar-nav" role="list">
          <li><button onClick={() => scrollTo('hero')} className="btn-ghost btn-sm">Home</button></li>
          <li><button onClick={() => scrollTo('about')} className="btn-ghost btn-sm">About</button></li>
          <li><button onClick={() => scrollTo('products')} className="btn-ghost btn-sm">Products</button></li>
          <li><button onClick={() => scrollTo('why-us')} className="btn-ghost btn-sm">Why Us</button></li>
          <li><button onClick={() => scrollTo('contact')} className="btn-ghost btn-sm">Contact</button></li>
        </ul>

        {/* Desktop actions */}
        <div className="navbar-actions">
          <ThemeToggle />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Login
          </button>
          {/* Hamburger */}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} role="menu">
        <button onClick={() => scrollTo('hero')} className="btn-ghost" style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', width: '100%' }}>Home</button>
        <button onClick={() => scrollTo('about')} className="btn-ghost" style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', width: '100%' }}>About</button>
        <button onClick={() => scrollTo('products')} className="btn-ghost" style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', width: '100%' }}>Products</button>
        <button onClick={() => scrollTo('why-us')} className="btn-ghost" style={{ textAlign: 'left', padding: '12px 0', borderBottom: '1px solid var(--border)', width: '100%' }}>Why Us</button>
        <button onClick={() => scrollTo('contact')} className="btn-ghost" style={{ textAlign: 'left', padding: '12px 0', width: '100%' }}>Contact</button>
        <div className="mobile-menu-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Toggle theme</span>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => { setMenuOpen(false); navigate(ROUTES.LOGIN); }}>
            Login to ERP
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
