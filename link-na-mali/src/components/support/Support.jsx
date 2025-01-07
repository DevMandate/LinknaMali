import React, { useState } from 'react';
import Button from '../button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const Support = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-white min-h-screen p-8 rounded-lg shadow-lg text-black">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Support</h2>
      
      {/* Contact Information */}
      <div className="mb-8 border-b pb-6">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700 text-left">Contact Information</h3>
        <p className="flex items-center text-gray-600 mb-2">
          <FontAwesomeIcon icon={faPhone} className="mr-2 text-blue-500" />
          <span>Phone: (123) 456-7890</span>
        </p>
        <p className="flex items-center text-gray-600">
          <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-blue-500" />
          <span>Email: support@merimesolutions.com</span>
        </p>
      </div>

      {/* Support Form */}
      <div className="mb-10">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Submit a Support Request</h3>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-100"
              placeholder="Enter your name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-100"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-100"
              placeholder="Enter subject"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-gray-100"
              rows="4"
              placeholder="Write your message here"
            />
          </div>
          <div className="text-center">
            <Button
              type="submit"
              className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-md shadow-md hover:bg-blue-600 transition duration-300"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>

      {/* Knowledge Base */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">Knowledge Base</h3>
        <ul className="space-y-4">
          <li className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2">How to List Your Property:</h4>
            <p className="text-gray-700 leading-relaxed">
              1. <strong>Create an Account:</strong> Visit our website and click on "Sign Up" to create an account.
              <br />
              2. <strong>List Your Property:</strong> Fill in the property details, upload images, and set the price.
              <br />
              3. <strong>Manage Inquiries:</strong> Respond to potential tenant inquiries and schedule viewings.
            </p>
          </li>
          <li className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2">Troubleshooting Common Issues:</h4>
            <p className="text-gray-700 leading-relaxed">
              1. <strong>Check Your Internet Connection:</strong> Ensure a stable internet connection.
              <br />
              2. <strong>Clear Browser Cache:</strong> Clear cache and cookies in your browser settings.
              <br />
              3. <strong>Contact Support:</strong> Reach out with details of the problem and screenshots if possible.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Support;
