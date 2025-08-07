import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import AppContext from '../../context/ServiceProviderAppContext';
import { Send, Paperclip, Menu } from 'lucide-react';

const API_BASE = 'https://api.linknamali.ke';

export default function UserTickets() {
  const { userData: { user_id, email } } = useContext(AppContext);
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responses, setResponses] = useState({});
  const [attachments, setAttachments] = useState({});
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/getusertickets/${user_id}`)
      .then(({ data }) => {
        const list = data.user_tickets || [];
        setTickets(list);
        setActiveTicket(list[0]?.ticket_id || null);
      })
      .catch(e => setError(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [user_id]);

  const handleChange = (ticketId, text) => {
    setResponses(r => ({ ...r, [ticketId]: text }));
  };
  const handleAttach = (ticketId, file) => {
    setAttachments(a => ({ ...a, [ticketId]: file }));
  };

  const handleSubmit = ticket => async e => {
    e.preventDefault();
    const msg = responses[ticket.ticket_id] || '';
    const file = attachments[ticket.ticket_id];
    if (!msg && !file) return;

    const form = new FormData();
    form.append('ticket_id', ticket.ticket_id);
    form.append('email', email);
    form.append('user_response', msg);
    if (file) form.append('evidence', file);

    try {
      await axios.post(`${API_BASE}/userrespondticket`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResponses(r => ({ ...r, [ticket.ticket_id]: '' }));
      setAttachments(a => ({ ...a, [ticket.ticket_id]: null }));
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  if (loading) return <p className="text-center py-10">Loading tickets...</p>;
  if (error) return <p className="text-red-600 text-center py-10">{error}</p>;
  if (!tickets.length) return <p className="text-center py-10">No tickets found.</p>;

  return (
    <div className="flex flex-col md:flex-row h-full bg-[var(--quaternary-color-light)]">
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-white border-b flex justify-between items-center">
        <h5 className="font-semibold">Tickets</h5>
        <button onClick={() => setShowMenu(prev => !prev)}>
          <Menu className="w-6 h-6 text-[var(--tertiary-color)]" />
        </button>
      </div>

      {/* Ticket List */}
      <aside className={`${showMenu ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white border-r overflow-y-auto`}>
        {tickets.map(t => (
          <div
            key={t.ticket_id}
            onClick={() => { setActiveTicket(t.ticket_id); setShowMenu(false); }}
            className={`p-4 cursor-pointer border-b last:border-none 
              ${activeTicket === t.ticket_id ? 'bg-[var(--secondary-color)] text-white' : 'hover:bg-gray-100'}`}
          >
            <h4 className="font-semibold truncate">#{t.ticket_number}</h4>
            <p className="text-sm truncate">{t.subject}</p>
          </div>
        ))}
      </aside>

      {/* Conversation Pane */}
      <section className="flex-1 flex flex-col">
        {tickets.filter(t => t.ticket_id === activeTicket).map(ticket => {
          const filteredConversations = ticket.conversations.filter((c, idx, arr) =>
            arr.findIndex(item =>
              item.sender === c.sender &&
              item.created_at === c.created_at &&
              item.message === c.message
            ) === idx
          );

          return (
            <div key={ticket.ticket_id} className="flex-1 flex flex-col bg-white">
              <header className="px-4 py-3 md:px-6 md:py-4 border-b">
                <h3 className="text-base md:text-lg font-bold truncate">{ticket.subject}</h3>
                <p className="text-xs text-[var(--tertiary-color)] truncate">
                  Status: {ticket.status} | Created: {ticket.created_at}
                </p>
              </header>

              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 flex flex-col">
                {filteredConversations.map((c, i) => {
                  const isUser = c.sender === 'User';
                  return (
                    <div key={i} className="flex w-full">
                      {!isUser && <div className="w-1/12 md:w-1/12" />}
                      <div className={`relative max-w-full md:max-w-2xl px-3 py-2 rounded-lg 
                        ${isUser ? 'bg-[var(--primary-color)] text-white self-end ml-auto' : 'bg-[var(--secondary-color)] text-white self-start mr-auto'}`}>
                        <p className="text-[10px] md:text-xs opacity-75 mb-1 truncate">
                          {c.sender} • {c.created_at}
                        </p>
                        <p className="whitespace-pre-wrap text-sm md:text-base">{c.message}</p>
                        {c.evidence_url && (
                          <img
                            src={c.evidence_url}
                            alt="attachment"
                            className="mt-2 max-w-full md:max-w-xs rounded-lg"
                          />
                        )}
                      </div>
                      {isUser && <div className="w-1/12 md:w-1/12" />}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit(ticket)} className="px-4 py-3 md:px-6 md:py-4 border-t flex items-center space-x-2 bg-white">
                <div className="relative flex-1">
                  <textarea
                    required
                    placeholder="Type your response..."
                    value={responses[ticket.ticket_id] || ''}
                    onChange={e => handleChange(ticket.ticket_id, e.target.value)}
                    className="w-full p-2 md:p-3 border rounded-full resize-none focus:outline-none focus:ring transition-size duration-200"
                    rows={1}
                  />
                  {attachments[ticket.ticket_id] && (
                    <span className="absolute right-3 bottom-2 text-xs text-[var(--tertiary-color)] truncate w-20 md:w-32">
                      {attachments[ticket.ticket_id].name}
                    </span>
                  )}
                </div>
                <label htmlFor="file-upload" className="p-2 text-[var(--secondary-color)] cursor-pointer">
                  <Paperclip className="w-5 h-5" />
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={e => handleAttach(ticket.ticket_id, e.target.files[0])}
                  />
                </label>
                <button type="submit" className="p-3 bg-[var(--primary-color)] text-white rounded-full hover:opacity-90 transition-transform duration-200 hover:scale-105">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          );
        })}
      </section>
    </div>
  );
}
