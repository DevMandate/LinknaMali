import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

// Configure axios
axios.defaults.baseURL = 'https://api.linknamali.ke';
axios.defaults.withCredentials = true;

function Card({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer transform transition-transform duration-200 hover:-translate-y-1"
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};

export default function GetCompanies({ onCardClick }) {
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // Call correct backend endpoint '/get-companies'
        const { data } = await axios.get('/get-companies', {
          params: { page: 1, per_page: 20 },
        });
        setCompanies(data.companies || []);
        setStatus({ loading: false, error: null });
      } catch (error) {
        console.error(error);
        setStatus({ loading: false, error: 'Unable to load companies.' });
      }
    };

    fetchCompanies();
  }, []);

  // Approve handler
  const handleApprove = async (companyId) => {
    try {
      const payload = { company_id: companyId, action: 'approve' };
      const response = await axios.post('/approve-rejectcompany', payload);
      window.alert(response.data.message || 'Company approved successfully.');
      // Optionally refresh the list or update that company's status locally:
      setCompanies((prev) =>
        prev.map((c) =>
          c.company_id === companyId ? { ...c, status: 'approved' } : c
        )
      );
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message || 'Error approving company.';
      window.alert(message);
    }
  };

  // Reject handler (prompts for reason)
  const handleReject = async (companyId) => {
    const reason = window.prompt(
      'Please enter a rejection reason for this company:',
      ''
    );

    if (reason === null) {
      // User cancelled the prompt
      return;
    }
    if (!reason.trim()) {
      window.alert('Rejection reason is required to reject.');
      return;
    }

    try {
      const payload = {
        company_id: companyId,
        action: 'reject',
        rejection_reason: reason.trim(),
      };
      const response = await axios.post('/approve-rejectcompany', payload);
      window.alert(response.data.message || 'Company rejected successfully.');
      // Optionally refresh the list or update that company's status locally:
      setCompanies((prev) =>
        prev.map((c) =>
          c.company_id === companyId
            ? { ...c, status: 'rejected', rejection_reason: reason.trim() }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message || 'Error rejecting company.';
      window.alert(message);
    }
  };

  if (status.loading) {
    return <p className="text-center text-[#8080A0]">Loading companies...</p>;
  }

  if (status.error) {
    return <p className="text-center text-[#8080A0]">{status.error}</p>;
  }

  return (
    <section className="max-w-6xl mx-auto mt-8 p-4">
      <h1 className="text-3xl font-bold text-[#29327E] mb-6">Companies</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.company_id}>
            <h2 className="text-xl font-semibold text-[#29327E] mb-2">
              {company.name}
            </h2>
            {company.email && (
              <p className="text-[#8080A0] mb-1">
                <span className="font-medium">Email:</span> {company.email}
              </p>
            )}
            {company.phone_number && (
              <p className="text-[#8080A0] mb-4">
                <span className="font-medium">Phone:</span> {company.phone_number}
              </p>
            )}

            {/* Show current status if available */}
            {company.status && (
              <p className="text-sm mb-2">
                <span className="font-medium">Status:</span> {company.status}
              </p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => handleApprove(company.company_id)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(company.company_id)}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Reject
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

GetCompanies.propTypes = {
  onCardClick: PropTypes.func,
};
