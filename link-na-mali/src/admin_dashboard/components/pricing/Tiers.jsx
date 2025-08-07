import React, { useState } from 'react';
import axios from 'axios';
import TiersForm from './TiersForm.jsx';
import PromotionsForm from './PromotionsForm.jsx';
import FeaturesForm from './FeaturesForm.jsx';
import AddOnsForm from './AddOnsForm.jsx';
import EntityList from './Tierslist.jsx';

export default function PricingDashboard() {
  const [active, setActive] = useState('tiers');
  const [view, setView] = useState('list'); // 'list' or 'form'

  const resourceLabels = {
    tiers: 'Premium Tier',
    promotions: 'Promotion',
    features: 'Tier Feature',
    addons: 'Add-On',
  };

  const components = {
    tiers: TiersForm,
    promotions: PromotionsForm,
    features: FeaturesForm,
    addons: AddOnsForm,
  };
  const ActiveForm = components[active];

  const handleCreate = async (data) => {
    try {
      const url = `https://api.linknamali.ke/create${active}`;
      const res = await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.status === 200 || res.status === 201) {
        alert(`${resourceLabels[active]} created successfully`);
        setView('list');
      } else {
        throw new Error(`Unexpected status ${res.status}`);
      }
    } catch (err) {
      console.error('Create error:', err);
      alert(`Error creating ${resourceLabels[active]}: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-[#29327E] text-center sm:text-left">Pricing Dashboard</h1>

      {/* Section Selector */}
      <nav aria-label="Resource section" className="flex flex-col sm:flex-row sm:items-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
        <span className="text-gray-600 font-medium sm:mr-2">Section:</span>
        <div className="flex flex-wrap gap-2 sm:gap-4 bg-gray-100 p-2 rounded-xl">
          {Object.entries(resourceLabels).map(([key, label]) => (
            <button
              key={key}
              title={`View ${label} list`}
              onClick={() => { setActive(key); setView('list'); }}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg focus:outline-none transition
                ${active === key
                  ? 'bg-[#29327E] text-white shadow'
                  : 'bg-white text-[#29327E] hover:bg-[#29327E] hover:text-white'}
              `}
            >
              {label}s
            </button>
          ))}
        </div>
      </nav>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
          {view === 'list'
            ? `${resourceLabels[active]} List`
            : `Create New ${resourceLabels[active]}`}
        </h2>
        <div className="flex justify-end sm:ml-auto space-x-2">
          {view === 'list' && (
            <button
              onClick={() => setView('form')}
              className="bg-[#29327E] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
            >
              + New {resourceLabels[active]}
            </button>
          )}
          {view === 'form' && (
            <button
              onClick={() => setView('list')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to List
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 overflow-x-auto">
        {view === 'list' ? (
          <EntityList onEdit={(res, item) => console.log('Edit', res, item)} />
        ) : (
          <ActiveForm onSubmit={data => handleCreate(data)} />
        )}
      </div>
    </div>
  );
}
