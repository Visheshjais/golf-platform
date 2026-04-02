/* src/components/Navbar.jsx */
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false); // mobile menu

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="logo-dot" />
          <span>Golf<span className="logo-accent">+</span>Charity</span>
        </Link>

        {/* Desktop links */}
        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/charities" onClick={() => setOpen(false)}>Charities</NavLink>
          <NavLink to="/draws"     onClick={() => setOpen(false)}>Draw Results</NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className="nav-admin" onClick={() => setOpen(false)}>Admin</NavLink>
              )}
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/login"    onClick={() => setOpen(false)}>Login</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={`hamburger ${open ? 'active' : ''}`} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
