import React, { useState } from "react";
import { Link } from "react-router-dom";
import SettingsPopup from "../pages/settings/Settings";
import "./Navbar.css";

function Navbar({ onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prevState) => !prevState);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/accounts">Qureshi Traders</Link>
        </div>

        {/* Mobile Menu Icon */}
        <div className="navbar-menu-icon" onClick={toggleMenu}>
          <span className="navbar-menu-bar"></span>
          <span className="navbar-menu-bar"></span>
          <span className="navbar-menu-bar"></span>
        </div>

        {/* Navigation Links */}
        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link to="/accounts" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Accounts
          </Link>
          <Link to="/employees" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Employees
          </Link>
          <Link to="/salaries" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Salaries
          </Link>
          <Link to="/mediator" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Mediators
          </Link>
          <Link to="/supplier" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Supplier
          </Link>
          <Link to="/what" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Alert
          </Link>
          <Link to="/renewals" className="navbar-link" onClick={() => setMenuOpen(false)}>
            Renewals
          </Link>
          <SettingsPopup />
          <button className="navbar-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
