import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://api.linknamali.ke';
const CREATE_TIER_URL = `${API_BASE}/createpremiumtiers`;

// Define all possible features
const allFeatures = [
  'Listings Included',
  'Verified Agent Badge',
  'Homepage Exposure',
  'WhatsApp Status',
  'Social Media Features',
  'Blog/Spotlight Article',
  'Email Newsletter Slot',
  'Merime WiFi Banner',
  'Video Tour Feature',
  'Early Access to Leads',
  'Networking & Events',
  'Custom Page Discount',
  'Performance Reports',
  'Dedicated WhatsApp Support',
  'Invoicing + MPesa Receipts'
];

// Map each tier template to its default features
const tierTemplates = {
  Starter: [
    'Listings Included',
    'Verified Agent Badge',
    'Invoicing + MPesa Receipts'
  ],
  Growth: [
    'Listings Included',
    'Verified Agent Badge',
    'Homepage Exposure',
    'WhatsApp Status',
    'Social Media Features',
    'Blog/Spotlight Article',
    'Email Newsletter Slot',
    'Merime WiFi Banner',
    'Dedicated WhatsApp Support',
    'Invoicing + MPesa Receipts'
  ],
  Max: [
    'Listings Included',
    'Verified Agent Badge',
    'Homepage Exposure',
    'WhatsApp Status',
    'Social Media Features',
    'Blog/Spotlight Article',
    'Email Newsletter Slot',
    'Merime WiFi Banner',
    'Video Tour Feature',
    'Early Access to Leads',
    'Networking & Events',
    'Custom Page Discount',
    'Performance Reports',
    'Dedicated WhatsApp Support',
    'Invoicing + MPesa Receipts'
  ],
  Enterprise: [...allFeatures]
};

export default function EnhancedTiersForm() {
  const [data, setData] = useState({
    name: '',
    price: '',
    max_listings: '',
    is_active: true
  });
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  // When name changes, auto-select default features
  useEffect(() => {
    if (data.name && tierTemplates[data.name]) {
      setSelectedFeatures(tierTemplates[data.name]);
    } else {
      setSelectedFeatures([]);
    }
  }, [data.name]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeatureToggle = feature => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: data.name,
      price: data.price !== '' ? parseFloat(data.price) : null,
      max_listings: data.max_listings !== '' ? parseInt(data.max_listings, 10) : null,
      is_active: data.is_active,
      description: selectedFeatures.join(', ')
    };

    try {
      const res = await axios.post(CREATE_TIER_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      window.alert(`✅ Tier “${res.data.tier.name}” created successfully!`);
      // Reset form
      setData({ name: '', price: '', max_listings: '', is_active: true });
      setSelectedFeatures([]);
    } catch (err) {
      window.alert(`❌ Failed to create tier: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Create Premium Tier</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier Name Dropdown */}
        <select
          name="name"
          required
          value={data.name}
          onChange={handleChange}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Select Tier…</option>
          {Object.keys(tierTemplates).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          name="price"
          type="number"
          placeholder="Price"
          value={data.price}
          onChange={handleChange}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          name="max_listings"
          type="number"
          placeholder="Max Listings"
          value={data.max_listings}
          onChange={handleChange}
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <label className="flex items-center space-x-2 md:col-span-2">
          <input
            name="is_active"
            type="checkbox"
            checked={data.is_active}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-gray-700">Active</span>
        </label>

        {/* Feature Checklist */}
        <div className="md:col-span-2">
          <p className="font-medium mb-2">Features:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border p-2 rounded">
            {allFeatures.map(f => (
              <label key={f} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(f)}
                  onChange={() => handleFeatureToggle(f)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-800">{f}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create Tier'}
      </button>
    </form>
  );
}
