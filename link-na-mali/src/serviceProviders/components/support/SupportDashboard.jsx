import React, { useState } from 'react';
// Ensure correct file name casing for imports
import SupportTicketForm from './Create';
import UserTickets from './UserTickets';
import { FilePlus, List } from 'lucide-react';

/**
 * SupportDashboard
 * Parent page toggling between ticket creation and ticket history/response.
 */
export default function SupportDashboard() {
  const [view, setView] = useState('history'); // default to ticket history

  return (
    <div className="min-h-screen bg-[var(--quaternary-color-light)] p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Navigation Tabs */}
      <nav className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setView('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 text-white ${
            view === 'history'
              ? 'bg-[var(--primary-color)]'
              : 'bg-[var(--secondary-color)] hover:bg-[var(--tertiary-color)]'
          }`}
        >
          <List className="w-5 h-5" />
          <span>My Tickets</span>
        </button>

        <button
          onClick={() => setView('create')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 text-white ${
            view === 'create'
              ? 'bg-[var(--primary-color)]'
              : 'bg-[var(--secondary-color)] hover:bg-[var(--tertiary-color)]'
          }`}
        >
          <FilePlus className="w-5 h-5" />
          <span>Create Ticket</span>
        </button>
      </nav>

      <main className="flex-1 bg-white rounded-b-lg shadow p-4 md:p-6 lg:p-8">
        {view === 'create' ? <SupportTicketForm /> : <UserTickets />}
      </main>
    </div>
  );
}
