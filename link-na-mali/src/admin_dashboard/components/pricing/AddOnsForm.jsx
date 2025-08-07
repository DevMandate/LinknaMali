// src/AddOnsForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// CORS-friendly API base
const API_BASE = 'https://api.linknamali.ke';
const CREATE_ADDON_URL = `${API_BASE}/createaddons`;

// Predefined add-on templates
const addOnTemplates = [
  { label: 'Select Add-On…', value: '' },
  { label: 'Video Property Tour', value: 'video_tour', description: 'High-quality video produced and posted by Linknamali', price_min: 3000, price_max: 5000, is_monthly: false },
  { label: 'Custom Landing Page', value: 'custom_page', description: 'Standalone or branded subdomain for firms', price_min: 2000, price_max: 15000, is_monthly: true },
  { label: 'Sponsored Blog Post', value: 'blog_post', description: 'Get featured in a thought-leader editorial', price_min: 4000, price_max: 4000, is_monthly: false },
  { label: 'Dedicated Email Blast', value: 'email_blast', description: 'Email campaign promoting their listings or firm', price_min: 5000, price_max: 10000, is_monthly: false },
  { label: 'Analytics Dashboard Access', value: 'analytics', description: 'Custom dashboard for views, leads, conversions', price_min: 2000, price_max: 2000, is_monthly: true },
  { label: 'Visibility Booster Bundle', value: 'visibility_bundle', description: '1 WhatsApp status + 1 social post + homepage exposure for 7 days', price_min: 1500, price_max: 1500, is_monthly: false },
  { label: 'Pay-as-you-Go Promo', value: 'paygo', description: '1 Featured Listing (KES 500) / 1 WhatsApp Post (KES 250)', price_min: 250, price_max: 500, is_monthly: false }
];

export default function AddOnsForm({ onSubmit }) {
  const [template, setTemplate] = useState('');
  const [data, setData] = useState({ name: '', description: '', price_min: '', price_max: '', is_monthly: false, included_in_tier_id: '' });
  const [loading, setLoading] = useState(false);

  // Initialize data when template changes
  useEffect(() => {
    if (!template) {
      setData({ name: '', description: '', price_min: '', price_max: '', is_monthly: false, included_in_tier_id: '' });
    } else {
      const tpl = addOnTemplates.find(t => t.value === template);
      if (tpl) {
        setData({
          name: tpl.label,
          description: tpl.description || '',
          price_min: tpl.price_min ?? '',
          price_max: tpl.price_max ?? '',
          is_monthly: tpl.is_monthly,
          included_in_tier_id: ''
        });
      }
    }
  }, [template]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!data.name.trim()) {
      window.alert('❌ Name is required.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        price_min: data.price_min !== '' ? Number(data.price_min) : undefined,
        price_max: data.price_max !== '' ? Number(data.price_max) : undefined,
        is_monthly: data.is_monthly,
        included_in_tier_id: data.included_in_tier_id || undefined
      };
      const res = await axios.post(CREATE_ADDON_URL, payload, { headers: { 'Content-Type': 'application/json' } });
      window.alert(`✅ ${res.data.message || 'Add-on created successfully.'}`);
      setTemplate('');
      setData({ name: '', description: '', price_min: '', price_max: '', is_monthly: false, included_in_tier_id: '' });
      if (onSubmit) onSubmit(res.data.addon);
    } catch (err) {
      const msg = err.response?.data?.error || err.request ? 'No response from server.' : 'Unexpected error.';
      window.alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { borderColor: '#29327E', color: '#29327E' };
  const labelStyle = { color: '#29327E' };
  const btnStyle = { backgroundColor: '#29327E', color: '#fff' };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4" style={labelStyle}>Create Add-On</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={template}
          required
          onChange={e => setTemplate(e.target.value)}
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        >
          {addOnTemplates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          name="name"
          placeholder="Name"
          value={data.name}
          onChange={handleChange}
          required
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        />
        <input
          name="description"
          placeholder="Description"
          value={data.description}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        />
        <input
          name="price_min"
          type="number"
          placeholder="Min Price"
          value={data.price_min}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        />
        <input
          name="price_max"
          type="number"
          placeholder="Max Price"
          value={data.price_max}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        />
        <label className="flex items-center space-x-2">
          <input
            name="is_monthly"
            type="checkbox"
            checked={data.is_monthly}
            onChange={handleChange}
            className="h-5 w-5"
            style={{ accentColor: '#29327E' }}
          />
          <span style={labelStyle}>Monthly</span>
        </label>
        <input
          name="included_in_tier_id"
          placeholder="Included in Tier ID (optional)"
          value={data.included_in_tier_id}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 px-6 py-2 rounded-lg transition disabled:opacity-50"
        style={btnStyle}
      >
        {loading ? 'Creating…' : 'Create Add-On'}
      </button>
    </form>
  );
}