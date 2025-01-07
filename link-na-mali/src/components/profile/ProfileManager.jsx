import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faAddressCard, faPhone } from '@fortawesome/free-solid-svg-icons';

const ProfileManagement = () => {
  const [profile, setProfile] = useState({
    name: 'Sharon Sachi',
    email: 'test123@example.com',
    phone: '0712345678',
    image: null,
  });
  const [address, setAddress] = useState({ county: 'Kilifi', city: 'Kilifi', town: 'Mtwapa', zip: '12345' });
  const [contact, setContact] = useState({ phone: '0712345678', alternateEmail: 'test123@example.com' });
  const [activeSection, setActiveSection] = useState('profile');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfile({ ...profile, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="bg-white p-6 shadow-md rounded-lg">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Profile</h2>

            <div className="mb-6 flex flex-col items-center">
              <div className="w-32 h-32 relative">
                <img
                  src={profile.image || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover shadow-md"
                />
                <label
                  htmlFor="imageUpload"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </label>
              </div>
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
              />
            </div>

            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              onClick={() => alert('Profile updated successfully!')}
            >
              Update Profile
            </button>
          </div>
        );
      case 'address':
        return (
          <div className="bg-white p-6 shadow-md rounded-lg text-black">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Address</h2>
            {['county', 'city', 'town', 'zip'].map((field) => (
              <div className="mb-4" key={field}>
                <label className="block text-gray-700 mb-2 capitalize">{field}</label>
                <input
                  type="text"
                  value={address[field]}
                  onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                  className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                />
              </div>
            ))}
          </div>
        );
      case 'contact':
        return (
          <div className="bg-white p-6 shadow-md rounded-lg text-black">
            <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Contact Information</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Phone/mobile</label>
              <input
                type="text"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Alternate Email</label>
              <input
                type="email"
                value={contact.alternateEmail}
                onChange={(e) => setContact({ ...contact, alternateEmail: e.target.value })}
                className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 text-black">
      {/* Sidebar */}
      <div className="w-full md:w-1/5 bg-white shadow-lg p-4 border-r border-gray-300">
        <h1 className="text-xl font-bold mb-4 text-gray-800">User Profile</h1>
        <nav>
          <ul>
            <li className="mb-3">
              <button
                onClick={() => setActiveSection('profile')}
                className={`text-base font-medium flex items-center ${
                  activeSection === 'profile'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Profile
              </button>
            </li>
            <li className="mb-3">
              <button
                onClick={() => setActiveSection('address')}
                className={`text-base font-medium flex items-center ${
                  activeSection === 'address'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <FontAwesomeIcon icon={faAddressCard} className="mr-2" />
                Address
              </button>
            </li>
            <li className="mb-3">
              <button
                onClick={() => setActiveSection('contact')}
                className={`text-base font-medium flex items-center ${
                  activeSection === 'contact'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                <FontAwesomeIcon icon={faPhone} className="mr-2" />
                Contact
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Content */}
      <div className="w-full md:w-4/5 p-6">{renderSection()}</div>
    </div>
  );
};

export default ProfileManagement;