import React, { useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { useAdminAppContext } from "../context/AdminAppContext";
import AdminSidebar from "../components/AdminSidebar"; 
import Header from "../components/Header";
import AdminSignup from "./AdminSignup";
import AdminProfile from "./AdminProfile";
import AgentManager from "../components/agents/Register";
import GetCompanies from "../components/company/Manage";

const AdminSettings = () => {
  const { handleLogout } = useAdminAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [showAdminSignup, setShowAdminSignup] = useState(false);
   const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const renderContent = () => {
    switch(activeTab) {
      case 'account':
        return <AdminProfile />;

      case 'admin':
        return (
          <>
            <button
              onClick={() => setShowAdminSignup(true)}
              className="px-4 py-2 bg-[#35BEBD] text-white rounded-2xl hover:bg-[#2ca8a6] transition mb-4"
            >
              Register New Admin
            </button>
            {showAdminSignup && (
              <AdminSignup
                onSuccess={() => setShowAdminSignup(false)}
                onCancel={() => setShowAdminSignup(false)}
              />
            )}
          </>
        );

      case 'agents':
        return (
          <AgentManager />
        );

      case 'companies':
        return (
          <GetCompanies onCardClick={company => console.log('Company clicked:', company)} />
        );

      case 'role':
        return (
          <form className="space-y-4 max-w-md">
            {/* ...role assignment form... */}
          </form>
        );

      case 'logout':
        return (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#29327E] text-white rounded-2xl hover:bg-[#1f285f] transition"
          >
            Logout
          </button>
        );

      default:
        return null;
    }
  };

  // Navigation items with Agents as its own entry
  const navItems = [
    { key: 'account',   label: 'Account' },
    { key: 'admin',     label: 'Admin Management' },
    { key: 'agents',    label: 'Manage Listing Agents' },
    { key: 'companies', label: 'Manage Companies' },
    { key: 'role',      label: 'Role Assignment' },
    { key: 'logout',    label: 'Logout' },
  ];

  return (
    <div className={`flex flex-col min-h-screen bg-gray-100 ${isSidebarOpen ? 'md:pl-64' : ''}`}>
      <Header onSidebarToggle={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <main className="flex-1 p-6 pt-24">
                {/* ← Back to Dashboard button */}
        <div className="pt-6 mb-6">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
      </div>
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6 flex flex-col md:flex-row">

          {/* Mini Sidebar */}
          <nav className="flex-shrink-0 w-full md:w-48 bg-gray-50 rounded-xl p-4 mb-6 md:mb-0">
            <ul className="space-y-4">
              {navItems.map(item => (
                <li key={item.key}>
                  <button
                    onClick={() => { 
                      setActiveTab(item.key);
                      setShowAdminSignup(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-2xl transition ${
                      activeTab === item.key
                        ? 'bg-[#35BEBD] text-white font-semibold'
                        : 'text-[#29327E] hover:bg-[#35BEBD]/20'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <section className="flex-1 ml-0 md:ml-6">
            <header className="mb-6 border-b pb-4">
              <h1 className="text-2xl font-bold text-[#29327E] capitalize">
                {navItems.find(i => i.key === activeTab)?.label}
              </h1>
            </header>
            {renderContent()}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
