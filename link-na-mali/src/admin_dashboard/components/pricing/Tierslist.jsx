import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Brand color values
const COLORS = {
  primary: '#29327E',
  secondary: '#35BEBD',
  tertiary: '#8080A0',
  quaternary: '#C1B3AF',
  quaternaryDark: '#A89A95'
};

// CORS-friendly API base
const BASE_URL = 'https://api.linknamali.ke';
axios.defaults.baseURL = BASE_URL;
axios.defaults.withCredentials = true;

// Fetch helpers
const fetchTiers = () => axios.get('/fetchpremiumtiers');
const fetchFeatures = () => axios.get('/fetchtierfeatures');
const fetchAddOns = () => axios.get('/fetchaddons');
const fetchPromotions = () => axios.get('/fetchpromotions');

// Config for each resource
const listConfigs = {
  tiers: { label: 'Premium Tiers', fetchFn: fetchTiers, deleteEndpoint: 'deletepremiumtier', dataKey: 'tiers' },
  promotions: { label: 'Promotions', fetchFn: fetchPromotions, deleteEndpoint: 'deletepromotion', dataKey: 'promotions' },
  features: { label: 'Tier Features', fetchFn: fetchFeatures, deleteEndpoint: 'deletetierfeature', dataKey: 'tier_features' },
  addons: { label: 'Add-Ons', fetchFn: fetchAddOns, deleteEndpoint: 'deleteaddon', dataKey: 'addons' }
};

export default function EntityCardsList({ onEdit }) {
  const [resource, setResource] = useState('tiers');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const cfg = listConfigs[resource];

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cfg.fetchFn();
        setItems(res.data[cfg.dataKey] || []);
      } catch (err) {
        setError(`Failed to load ${cfg.label}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [resource]);

  const handleDelete = async id => {
    if (!window.confirm(`Delete this ${cfg.label}?`)) return;
    try {
      await axios.delete(`/${cfg.deleteEndpoint}/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert(`Failed to delete ${cfg.label}`);
    }
  };

  if (loading) return <p style={{ color: COLORS.tertiary }}>Loading {cfg.label}…</p>;
  if (error) return <p style={{ color: COLORS.quaternaryDark }}>{error}</p>;

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.primary, marginBottom: '1rem' }}>
        Manage {cfg.label}
      </h1>

      <select
        value={resource}
        onChange={e => setResource(e.target.value)}
        style={{
          border: `2px solid ${COLORS.primary}`,
          padding: '0.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        {Object.entries(listConfigs).map(([key, c]) => (
          <option key={key} value={key}>{c.label}</option>
        ))}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '1rem',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              borderTop: `4px solid ${COLORS.primary}`,
              overflow: 'hidden',
              transform: 'scale(1)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div
              style={{ padding: '1rem', cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              {/* Title and subtitle */}
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.primary }}>
                {item.name || item.title || item.feature_name || item.code}
              </h3>
              <p style={{ margin: '0.5rem 0', fontWeight: '600', color: COLORS.secondary }}>
                {cfg.label === 'Premium Tiers' ? `$${item.price}/mo` : item.type || item.category || ''}
              </p>
            </div>

            {expandedId === item.id && (
              <div style={{ padding: '1rem', backgroundColor: '#f9f9f9' }}>
                {/* Display all item properties */}
                {Object.entries(item).map(([key, val]) => (
                  <p key={key} style={{ marginBottom: '0.5rem', color: '#333' }}><strong>{key}:</strong> {String(val)}</p>
                ))}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => onEdit(resource, item)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: COLORS.tertiary, color: '#fff', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = COLORS.quaternary}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = COLORS.tertiary}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', backgroundColor: COLORS.quaternaryDark, color: '#fff', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = COLORS.quaternary}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = COLORS.quaternaryDark}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
