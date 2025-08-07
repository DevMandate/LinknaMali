import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="admin-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} Merime Development Limited. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;