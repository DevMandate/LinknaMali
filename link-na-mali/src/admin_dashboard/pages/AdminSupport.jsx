import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';
import { useNavigate, useSearchParams } from 'react-router-dom';

const isValidImageUrl = (url) => /\.(jpg|jpeg|png|gif)$/i.test(url);

const Modal = ({ isOpen, onRequestClose, children, className = '' }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onRequestClose}
    >
      <div
        className={`
          ${className}
          bg-white p-6 rounded-2xl
          max-w-2xl w-full
          max-h-[80vh]
          overflow-y-auto
          shadow-lg transform transition-transform
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const AdminSupport = () => {
   const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [detailTicket, setDetailTicket] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [searchParams] = useSearchParams();
  const highlightTicket = searchParams.get('highlightTicket');

  const fetchTickets = async () => {
    try {
      const res = await axios.get('https://api.linknamali.ke/support/tickets');
      if (res.data?.tickets) {
        const data = await Promise.all(
          res.data.tickets.map(async (ticket) => {
            try {
              const convRes = await axios.get(
                `https://api.linknamali.ke/ticketconversations/${ticket.ticket_id}`
              );
              return { ...ticket, conversation: convRes.data.conversation };
            } catch {
              return { ...ticket, conversation: [] };
            }
          })
        );
        setTickets(data);
      }
    } catch (e) {
      console.error('Error fetching tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (highlightTicket && tickets.length) {
      const el = document.getElementById(`ticket-${highlightTicket}`);
      if (el) {
        el.classList.add('animate-pulse', 'bg-blue-50', 'ring-2', 'ring-blue-500');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightTicket, tickets]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleApprove = async (id) => {
    try {
      await axios.put(`https://api.linknamali.ke/tickets/${id}`, { status: 'Resolved' });
      setSuccessMessage('Ticket resolved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTickets();
    } catch {
      alert('Failed to resolve ticket.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.linknamali.ke/tickets/${id}/delete`);
      setSuccessMessage('Ticket deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTickets();
    } catch {
      alert('Failed to delete ticket.');
    }
  };

  const handleResponseSubmit = async (id) => {
    try {
      await axios.post('https://api.linknamali.ke/sendadminresponse', {
        ticket_id: id,
        admin_response: adminResponse,
      });
      setSuccessMessage('Response sent successfully!');
      setSelectedTicket(null);
      setAdminResponse('');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchTickets();
    } catch {
      alert('Failed to send response.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const statusOk = statusFilter === 'All' || t.status.toLowerCase() === statusFilter.toLowerCase();
    const urgencyOk =
      statusFilter === 'Open'
        ? urgencyFilter === 'All' || t.urgency.toLowerCase() === urgencyFilter.toLowerCase()
        : true;
    return statusOk && urgencyOk;
  });

  const filterDuplicates = (conv) => {
    const seen = new Set();
    return conv.filter((m) => {
      const key = `${m.sender}-${m.message}-${m.sent_at}`;
      return seen.has(key) ? false : seen.add(key);
    });
  };

  return (
    <div className={`flex flex-col bg-gray-100 min-h-screen ${isSidebarOpen ? 'md:pl-64' : ''}`}>
      <Header onSidebarToggle={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <main className="flex-1 p-6 pt-20 bg-gray-50">
            {/* ← Back to Dashboard button */}
        <div className="pt-6 mb-6">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
      </div>

        {successMessage && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <section className="bg-white p-6 mb-8 rounded-lg shadow-sm flex flex-wrap gap-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setUrgencyFilter('All'); }}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <option>All</option>
              <option>Open</option>
              <option>User Responded</option>
              <option>Resolved</option>
            </select>
          </div>
          {statusFilter === 'Open' && (
            <div className="flex flex-col">
              <label className="font-semibold mb-2">Urgency</label>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          )}
        </section>

        {/* Ticket list / loading / no-data */}
        {loading ? (
          <p>Loading tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <p>No support tickets found.</p>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.ticket_id}
                id={`ticket-${ticket.ticket_id}`}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setDetailTicket(ticket)}
              >
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-2">Ticket #{ticket.ticket_number}</h2>
                  <p className="text-sm text-gray-600 mb-4 truncate">{ticket.subject}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 rounded-full">{ticket.status}</span>
                    <span className="px-2 py-1 bg-red-100 rounded-full">{ticket.urgency}</span>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(ticket.ticket_id); }}
                    className="flex-1 text-center py-2 bg-teal-500 text-white rounded-lg"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                    className="flex-1 text-center py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Respond
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Detail Modal */}
        {detailTicket && (
          <Modal isOpen onRequestClose={() => setDetailTicket(null)}>
            <h2 className="text-2xl font-bold mb-4">Ticket #{detailTicket.ticket_number}</h2>
            <div className="space-y-3 mb-6">
              <p><strong>User:</strong> {detailTicket.username}</p>
              <p><strong>Subject:</strong> {detailTicket.subject}</p>
              <p><strong>Type:</strong> {detailTicket.type}</p>
              <p><strong>Urgency:</strong> {detailTicket.urgency}</p>
              <p><strong>Status:</strong> {detailTicket.status}</p>
              <p><strong>Message:</strong></p>
              <p className="p-3 bg-gray-100 rounded-lg whitespace-pre-wrap">{detailTicket.message}</p>
              {detailTicket.evidence && isValidImageUrl(detailTicket.evidence) && (
                <img src={detailTicket.evidence} alt="Evidence" className="max-w-full rounded-lg" />
              )}
              <p className="text-sm text-gray-500">Created: {detailTicket.created_at}</p>
              <p className="text-sm text-gray-500">Updated: {detailTicket.updated_at}</p>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDetailTicket(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >Close</button>
            </div>
          </Modal>
        )}

        {/* Respond Modal */}
        {selectedTicket && (
          <Modal isOpen onRequestClose={() => setSelectedTicket(null)}>  
            <h2 className="text-xl font-bold mb-4">Respond to #{selectedTicket.ticket_number}</h2>
            <div className="max-h-64 overflow-auto mb-4 space-y-2 flex flex-col">
              {filterDuplicates(selectedTicket.conversation).map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg shadow ${msg.sender.toLowerCase() === 'admin' ? 'bg-green-100 self-end' : 'bg-white self-start'}`}
                >
                  {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                  {msg.evidence && <img src={msg.evidence} alt="Attachment" className="mt-2 max-w-full rounded-lg" />}
                </div>
              ))}
            </div>
            <textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={4}
              className="w-full p-2 border rounded-lg mb-4"
              placeholder="Enter response..."
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => handleResponseSubmit(selectedTicket.ticket_id)}
                disabled={!adminResponse.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >Send Response</button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >Cancel</button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
};

export default AdminSupport;
