import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '../searchbar/SearchBar';
import Button from '../button/Button';

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    console.log('Logged out');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/signup');
  };

  return (
    <header className="bg-gray-800 text-white">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <Link to="/">LM</Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link to="/properties" className="hover:text-gray-300">
            Properties
          </Link>
          <Link to="/about" className="hover:text-gray-300">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-gray-300">
            Services
          </Link>
          <Link to="/contact" className="hover:text-gray-300">
            Contact Us
          </Link>
        </nav>

        {/* Search Bar (hidden on small screens) */}
        <div className="flex-grow md:flex-grow-0">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>

        {/* Account Menu */}
        <div className="relative hidden md:block">
          {isAuthenticated ? (
            <div>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-2 bg-gray-700 text-white rounded-full focus:outline-none"
              >
                <FontAwesomeIcon icon={faUser} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black p-2 rounded-md shadow-lg w-40 z-10">
                  <ul>
                    <li>
                      <Link to="/profile" className="block px-4 py-2 hover:bg-gray-200">
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <Button onClick={handleLogout} className="block px-4 py-2 w-full hover:bg-gray-500">
                        Logout
                      </Button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={handleLogin}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Login
              </Button>
              <Button
                onClick={handleSignup}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 bg-gray-700 text-white rounded-md focus:outline-none"
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 text-white p-4 space-y-4">
          <ul>
            <li>
              <Link to="/" className="block hover:text-gray-300">
                Home
              </Link>
            </li>
            <li>
              <Link to="/properties" className="block hover:text-gray-300">
                Properties
              </Link>
            </li>
            <li>
              <Link to="/about" className="block hover:text-gray-300">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="block hover:text-gray-300">
                Contact Us
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/profile" className="block hover:text-gray-300">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Button
                    onClick={handleLogout}>
                    Logout
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Button
                    onClick={handleLogin}>
                    Login
                  </Button>
                </li>
                <li>
                  <Button
                    onClick={handleSignup}>
                    Sign Up
                  </Button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
};

export default NavBar;
