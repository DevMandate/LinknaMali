// src/PromotionsForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// CORS-friendly API base
const API_BASE = 'https://api.linknamali.ke';
const FETCH_TIERS_URL = `${API_BASE}/fetchpremiumtiers`;
const CREATE_PROMO_URL = `${API_BASE}/createpromotion`;

const promotionTypeOptions = [
  { label: '7-day Growth Free Trial', value: 'free_trial_growth' },
  { label: 'KES 1,000 Off Max Upgrade', value: 'discount_max_upgrade' },
  { label: 'Top Max User Bonus', value: 'performance_incentive' },
  { label: 'July Listing Bonanza', value: 'seasonal_campaign' },
  { label: 'Pay-as-you-Go Featured Listing', value: 'payg_featured_listing' },
  { label: 'Pay-as-you-Go WhatsApp Post', value: 'payg_whatsapp_post' },
  { label: 'Visibility Booster Bundle', value: 'visibility_booster' },
  { label: 'Video Property Tour Add-On', value: 'addon_video_tour' },
  { label: 'Custom Landing Page Add-On', value: 'addon_custom_landing' },
  { label: 'Sponsored Blog Post Add-On', value: 'addon_sponsored_blog' },
  { label: 'Dedicated Email Blast Add-On', value: 'addon_email_blast' },
  { label: 'Analytics Dashboard Access', value: 'addon_analytics_dashboard' }
];

export default function PromotionsForm() {
  const [data, setData] = useState({
    title: '', type: '', discount: '', promo_code: '', applies_to_tier_id: '',
    start_date: '', end_date: ''
  });
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch and map tiers
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
      const payload = {
        title: data.title,
        type: data.type,
        discount: data.discount || undefined,
        promo_code: data.promo_code || undefined,
        applies_to_tier_id: data.applies_to_tier_id || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined
      };
      const response = await axios.post(CREATE_PROMO_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      window.alert(`✅ ${response.data.message}`);
      setData({ title: '', type: '', discount: '', promo_code: '', applies_to_tier_id: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('Error creating promotion:', err);
      window.alert(`❌ ${err.response?.data?.error || 'An unexpected error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const styleInput = { borderColor: '#29327E', color: '#29327E' };
  const styleLabel = { color: '#29327E' };
  const btnStyle = { backgroundColor: '#29327E', color: '#fff' };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4" style={styleLabel}>Create Promotion</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="title"
          placeholder="Title"
          required
          value={data.title}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={styleInput}
        />
        <select
          name="type"
          required
          value={data.type}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={styleInput}
        >
          <option value="" disabled>Select Type…</option>
          {promotionTypeOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          name="discount"
          type="number"
          placeholder="Discount"
          min="0"
          value={data.discount}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={styleInput}
        />
        <input
          name="promo_code"
          placeholder="Promo Code"
          value={data.promo_code}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={styleInput}
        />
        <select
          name="applies_to_tier_id"
          value={data.applies_to_tier_id}
          onChange={handleChange}
          className="border p-3 rounded-lg focus:outline-none"
          style={styleInput}
        >
          <option value="" disabled>Applies to Tier…</option>
          {tiers.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div>
          <label className="block text-sm font-medium mb-1" style={styleLabel}>Start Date</label>
          <input
            name="start_date"
            type="date"
            value={data.start_date}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:outline-none w-full"
            style={styleInput}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={styleLabel}>End Date</label>
          <input
            name="end_date"
            type="date"
            value={data.end_date}
            onChange={handleChange}
            className="border p-3 rounded-lg focus:outline-none w-full"
            style={styleInput}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
        style={btnStyle}
      >
        {loading ? 'Creating…' : 'Create Promotion'}
      </button>
    </form>
  );
}
