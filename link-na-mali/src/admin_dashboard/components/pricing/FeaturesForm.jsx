// src/TierFeatureForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// CORS-friendly API base
const API_BASE = 'https://api.linknamali.ke';
const FETCH_TIERS_URL = `${API_BASE}/fetchpremiumtiers`;
const CREATE_FEATURE_URL = `${API_BASE}/createtierfeatures`;

export default function TierFeatureForm() {
  const [tiers, setTiers] = useState([]);
  const [data, setData] = useState({ tier_id: '', feature_name: '', value: '', category: '', tooltip: '' });
  const [loading, setLoading] = useState(false);

  // Fetch tiers and map to { label, value }
  useEffect(() => {
    axios.get(FETCH_TIERS_URL)
      .then(res => {
        const options = (res.data.tiers || []).map(t => ({ label: t.name, value: t.id }));
        setTiers(options);
      })
      .catch(err => {
        console.error('Failed to fetch tiers:', err);
        window.alert('Unable to load tiers');
      });
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(CREATE_FEATURE_URL, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      window.alert(`✅ ${response.data.message}`);
      setData({ tier_id: '', feature_name: '', value: '', category: '', tooltip: '' });
    } catch (err) {
      console.error('Error adding feature:', err);
      window.alert(`❌ ${err.response?.data?.error || 'An unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4" style={{ color: '#29327E' }}>Add Tier Feature</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="tier_id"
          required
          value={data.tier_id}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={{ borderColor: '#29327E', color: '#29327E' }}
        >
          <option value="" disabled>Select Premium Tier…</option>
          {tiers.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          name="feature_name"
          placeholder="Feature Name"
          required
          value={data.feature_name}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={{ borderColor: '#29327E', color: '#29327E' }}
        />

        <input
          name="value"
          placeholder="Value (optional)"
          value={data.value}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={{ borderColor: '#29327E', color: '#29327E' }}
        />

        <input
          name="category"
          placeholder="Category (optional)"
          value={data.category}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={{ borderColor: '#29327E', color: '#29327E' }}
        />

        <input
          name="tooltip"
          placeholder="Tooltip (optional)"
          value={data.tooltip}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none md:col-span-2"
          style={{ borderColor: '#29327E', color: '#29327E' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
        style={{ backgroundColor: '#29327E' }}
      >
        {loading ? 'Adding…' : 'Add Feature'}
      </button>
    </form>
  );
}