import React, { useState, useContext } from 'react';
import axios from 'axios';
import AppContext from '../../context/ServiceProviderAppContext';
import { ChevronDown, FileText, Tag, AlertCircle, MessageSquare, Upload, Send } from 'lucide-react';

const API_BASE_URL = 'https://api.linknamali.ke';
const REQUIRED_CLASS = 'border-red-500';

export default function SupportTicketForm() {
  const { userData: { user_id, email } } = useContext(AppContext);
  const [form, setForm] = useState({ type: '', subject: '', urgency: 'Medium', message: '', property_id: '', ad_id: '' });
  const [evidence, setEvidence] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleFileChange = e => setEvidence(e.target.files[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    const { type, subject, message, property_id, ad_id } = form;
    if (!type || !subject || !message || (type === 'Listings' && !property_id) || (type === 'Ads' && !ad_id)) {
      return setStatus(s => ({ ...s, error: 'Please fill in all required fields.' }));
    }

    const data = new FormData();
    data.append('user_id', user_id);
    data.append('email', email);
    Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
    evidence && data.append('evidence', evidence);

    try {
      setStatus({ loading: true, error: '', success: '' });
      const res = await axios.post(`${API_BASE_URL}/supportticket`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setStatus({ loading: false, success: `Ticket #${res.data.ticket_number} created!`, error: '' });
      setForm({ type: '', subject: '', urgency: 'Medium', message: '', property_id: '', ad_id: '' });
      setEvidence(null);
    } catch (err) {
      setStatus({ loading: false, success: '', error: err.response?.data?.response || err.message });
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg">
      <h2 className="flex items-center text-2xl font-bold text-[var(--primary-color)] mb-6">
        <Tag size={24} />
        <span>Create Support Ticket</span>
      </h2>
      {status.error && <p className="text-red-600 mb-4 truncate">{status.error}</p>}
      {status.success && <p className="text-green-600 mb-4 truncate">{status.success}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex">
              Type<span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`w-full p-2 pr-8 border rounded-lg focus:ring ${!form.type ? REQUIRED_CLASS : ''}`}
              >
                <option value="">Select type</option>
                <option value="Listings">Listings</option>
                <option value="Ads">Ads</option>
                <option value="General">General</option>
              </select>
              <ChevronDown className="absolute right-2 top-3 text-gray-400" size={16} />
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <div className="relative">
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleChange}
                className="w-full p-2 pr-8 border rounded-lg focus:ring"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <AlertCircle className="absolute right-2 top-3 text-gray-400" size={16} />
            </div>
          </div>
        </div>

        {(form.type === 'Listings' || form.type === 'Ads') && (
          <div className="flex items-center border rounded-lg p-2">
            <FileText className="text-gray-400 mr-2" />
            <input
              name={form.type === 'Listings' ? 'property_id' : 'ad_id'}
              value={form.type === 'Listings' ? form.property_id : form.ad_id}
              onChange={handleChange}
              placeholder={form.type === 'Listings' ? 'Property ID*' : 'Ad ID*'}
              className={`flex-1 focus:outline-none ${!(form.type === 'Listings' ? form.property_id : form.ad_id) ? REQUIRED_CLASS : ''}`}
            />
          </div>
        )}

        <div className="flex items-center border rounded-lg p-2">
          <MessageSquare className="text-gray-400 mr-2" />
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject*"
            className={`flex-1 focus:outline-none ${!form.subject ? REQUIRED_CLASS : ''}`}
          />
        </div>

        <div className="flex flex-col border rounded-lg p-2">
          <label className="sr-only">Message*</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Message*"
            rows={4}
            className={`w-full focus:outline-none resize-none ${!form.message ? REQUIRED_CLASS : ''}`}
          />
        </div>

        <label className="flex items-center border rounded-lg p-2 cursor-pointer">
          <Upload className="text-gray-400 mr-2" />
          <span className="text-sm text-gray-600 truncate">{evidence ? evidence.name : 'supporting document(s)(optional)'}</span>
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>

        <button
          type="submit"
          disabled={status.loading}
          className="flex justify-center items-center gap-2 py-3 bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
        >
          <Send size={18} /> {status.loading ? 'Submitting…' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}
