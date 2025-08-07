import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { FaLink, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const App = () => {
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [agents, setAgents] = useState([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
    const [filter, setFilter] = useState('all');

  const API_BASE_URL = 'https://api.linknamali.ke';

  // Register a new agent
  const handleRegisterAgent = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setFetchError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/registeragents`,
        { name: agentName, email: agentEmail }
      );
      if (response.status === 201) {
        toast.success('Agent registered successfully!');
        setAgentName('');
        setAgentEmail('');
        fetchAgents();
      } else {
        toast.error(response.data.message || 'Failed to register agent.');
      }
    } catch (error) {
      console.error('Error registering agent:', error);
      toast.error(error.response?.data?.message || 'Registration error.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Fetch all agents
  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    setFetchError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/fetchlistingagents`
      );
      if (res.status === 200) {
        setAgents(res.data.agents || []);
        toast.info('Agents fetched successfully!');
      } else {
        toast.error(res.data.message || 'Fetch failed');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Error fetching agents');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  // Navigate to listing
  const handleLinkListing = (agent) => {
    localStorage.setItem(
      'selectedAgent',
      JSON.stringify({ id: agent.agent_id, name: agent.name })
    );
    navigate('/admin-dashboard/AdminPropertyManagement');
  };

  // Toggle active/inactive status
 const handleToggleStatus = async (agent) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/agents/toggle-status`,
      { agent_id: agent.agent_id, new_status: !agent.is_active }
    );
    if (response.status === 200) {
      // Update just this agent locally instead of refetching the whole list
      setAgents(prev =>
        prev.map(a =>
          a.agent_id === agent.agent_id
            ? { ...a, is_active: !a.is_active }
            : a
        )
      );
      toast.success(response.data.message || 'Status updated');
    }
  } catch (error) {
    console.error('Toggle error:', error);
    toast.error(error.response?.data?.message || 'Status toggle failed');
  }
};


  // Open edit modal
  const openEditModal = (agent) => {
    setCurrentAgent(agent);
    setAgentName(agent.name);
    setAgentEmail(agent.email);
    setShowModal(true);
  };

  // Save edits
  const saveEdits = async () => {
    if (!currentAgent) return;
    try {
      const response = await axios.put(
        `${API_BASE_URL}/updateagents/${currentAgent.agent_id}`,
        { name: agentName, email: agentEmail }
      );
      if (response.status === 200) {
        toast.success('Agent updated successfully!');
        fetchAgents();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  // Delete an agent
  const handleDeleteAgent = async (agent) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/deleteagents/${agent.agent_id}`
      );
      if (response.status === 200) {
        toast.success('Agent deleted successfully!');
        fetchAgents();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 mt-4">Agent Management Dashboard</h1>

      {/* Register New Agent */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mb-10 border border-[#AAB0D8]">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Register New Agent</h2>
        <form onSubmit={handleRegisterAgent} className="space-y-6">
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Agent Name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
          />
          <input
            type="email"
            value={agentEmail}
            onChange={(e) => setAgentEmail(e.target.value)}
            placeholder="Agent Email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
          />
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full text-[#35BEBD] py-3 rounded-md transition focus:outline-none"
          >
            {isRegistering ? 'Registering...' : 'Register Agent'}
          </button>
        </form>
      </div>

      {/* Existing Agents */}
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl border border-[#B8E2E1]">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Existing Agents</h2>
        <button
          onClick={fetchAgents}
          disabled={isLoadingAgents}
          className="w-full text-[#35BEBD] py-3 rounded-md transition focus:outline-none"
        >
          {isLoadingAgents ? 'Fetching Agents...' : 'Refresh List'}
        </button>
        {fetchError && <p className="text-red-600 text-center mb-4">{fetchError}</p>}
 <div className="mb-4 flex space-x-2 justify-center">
          <button
            onClick={() => setFilter('all')}
            className="px-4 py-2 text-[#35BEBD] bg-transparent border-none focus:outline-none"
          >All</button>
          <button
            onClick={() => setFilter('active')}
            className="px-4 py-2 text-[#35BEBD] bg-transparent border-none focus:outline-none"
          >Active</button>
          <button
            onClick={() => setFilter('inactive')}
            className="px-4 py-2 text-[#35BEBD] bg-transparent border-none focus:outline-none"
          >Inactive</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Agent ID</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Identifier</th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
           <tbody className="divide-y divide-gray-200">
              {agents
                .filter(agent => {
                  if (filter === 'all') return true;
                  if (filter === 'active') return agent.is_active;
                  return !agent.is_active; // 'inactive'
                })
                .map(agent => (
                  <tr key={agent.agent_id} className="hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-mono text-gray-900">{agent.agent_id.slice(0, 8)}...</td>
                    <td className="py-4 px-6 text-gray-900">{agent.name}</td>
                    <td className="py-4 px-6 text-gray-900">{agent.email}</td>
                    <td className="py-4 px-6 font-mono text-gray-900">{agent.unique_identifier || 'N/A'}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        {/* Link */}
                        <button onClick={() => handleLinkListing(agent)} title="Link Listing" className="bg-transparent p-0 hover:bg-transparent focus:outline-none focus:ring-0">
                          <FaLink className="text-[#35BEBD] text-xl" />
                        </button>
                        {/* Toggle */}
                        <button onClick={() => handleToggleStatus(agent)} title={agent.is_active ? 'Deactivate' : 'Activate'} className="bg-transparent p-0 hover:bg-transparent focus:outline-none focus:ring-0">
                          {agent.is_active ? <FaToggleOn className="text-[#35BEBD] text-xl" /> : <FaToggleOff className="text-[#35BEBD] text-xl" />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEditModal(agent)} title="Edit Agent" className="bg-transparent p-0 hover:bg-transparent focus:outline-none focus:ring-0">
                          <FaEdit className="text-[#35BEBD] text-xl" />
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDeleteAgent(agent)} title="Delete Agent" className="bg-transparent p-0 hover:bg-transparent focus:outline-none focus:ring-0">
                          <FaTrash className="text-[#35BEBD] text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Edit Agent</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
              />
              <input
                type="email"
                value={agentEmail}
                onChange={(e) => setAgentEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md border focus:outline-none focus:ring-0">
                Cancel
              </button>
              <button onClick={saveEdits} className="px-4 py-2 text-[#35BEBD] rounded-md focus:outline-none focus:ring-0">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
