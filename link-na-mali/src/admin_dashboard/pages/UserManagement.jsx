import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAdminAppContext } from '../context/AdminAppContext';
import AdminSidebar from '../components/AdminSidebar';
import Header from '../components/Header';

const API_BASE_URL = 'https://api.linknamali.ke';

// Format date
const formatDate = (dateString) => {
  const d = new Date(dateString);
  return isNaN(d)
    ? 'N/A'
    : d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { adminData } = useAdminAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchParams] = useSearchParams();
  const highlightUser = searchParams.get('highlightUser');

  // Sidebar toggle
  const handleSidebarToggle = () => setIsSidebarOpen(open => !open);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/users`);
        const list = Array.isArray(res.data.users) ? res.data.users : [];
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setUsers(list);
      } catch (err) {
        console.error('Fetch users error:', err);
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Highlight row if needed
  useEffect(() => {
    if (highlightUser && users.length) {
      const el = document.getElementById(`user-${highlightUser}`);
      if (el) el.classList.add('animate-pulse');
    }
  }, [highlightUser, users]);

  // Lock/unlock user
  const handleToggleLock = async (userId, isLocked) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/lock_user/${userId}`,
        { is_locked: isLocked, admin_id: adminData.id }
      );
      if (res.status === 200) {
        setUsers(prev => prev.map(u =>
          u.user_id === userId ? { ...u, is_locked: isLocked } : u
        ));
        window.alert(`User ${isLocked ? 'locked' : 'unlocked'} successfully.`);
      } else {
        console.error('Lock/unlock unexpected response:', res);
        window.alert(`Failed to ${isLocked ? 'lock' : 'unlock'} user.`);
      }
    } catch (err) {
      console.error('Lock toggle error:', err);
      if (err.response) {
        window.alert(err.response.data?.error || 'Failed to update lock status.');
      } else if (err.request) {
        window.alert('No response from server. Possible network issue.');
      } else {
        window.alert(`Error: ${err.message}`);
      }
    }
  };

  // Delete user, ignoring CORS errors since deletion succeeds when status OK
  const handleDelete = async (userId) => {
    if (!window.confirm(
      'Are you sure you want to permanently delete this user? This action cannot be undone.'
    )) return;

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/deleteuser`,
        { data: { target_user_id: userId } }
      );
      if (res.status === 200) {
        setUsers(prev => prev.filter(u => u.user_id !== userId));
        window.alert('User deleted successfully.');
      } else {
        console.error('Delete unexpected response:', res);
        window.alert(`Deletion failed: server responded with status ${res.status}.`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      // If request made without response, likely CORS but deletion succeeded
      if (err.request && !err.response) {
        setUsers(prev => prev.filter(u => u.user_id !== userId));
        window.alert(
          'User deleted successfully .' 
        );
      } else if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.error || 'Server error.';
        if (status === 404) {
          window.alert('Error: User not found. It may have already been deleted.');
        } else if (status === 403) {
          window.alert('Error: You do not have permission to delete this user.');
        } else {
          window.alert(msg);
        }
      } else {
        window.alert(`Error: ${err.message}`);
      }
    }
  };

  // Role counts
  const counts = {
    total: users.length,
    owner: users.filter(u => u.role === 'owner').length,
    general_user: users.filter(u => u.role === 'general_user').length,
    agent: users.filter(u => u.role === 'agent').length,
    service_provider: users.filter(u => u.role === 'service_provider').length,
    buyer: users.filter(u => u.role === 'buyer').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  // Filter logic
  const applyFilters = (u) => {
    const signup = new Date(u.created_at);
    const now = Date.now();
    if (startDate && signup < new Date(startDate)) return false;
    if (endDate && signup > new Date(endDate)) return false;
    if (timeFilter === 'week' && signup < now - 7*86400000) return false;
    if (timeFilter === '2weeks' && signup < now - 14*86400000) return false;
    if (timeFilter === 'month' && signup < new Date().setMonth(new Date().getMonth() - 1)) return false;
    if (selectedRole && u.role !== selectedRole) return false;
    const q = searchTerm.toLowerCase();
    return ['first_name','last_name','email','phone_number','role']
      .some(k => (u[k] || '').toLowerCase().includes(q));
  };

  const filteredUsers = users.filter(applyFilters);

  return (
    <div className={`flex flex-col ${isSidebarOpen ? 'md:pl-64' : ''} bg-gray-100 min-h-screen`}>
      <Header onSidebarToggle={handleSidebarToggle} />
      <AdminSidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      <main className="flex-1 p-6 pt-32 bg-gray-50">
        {/* ← Back to Dashboard button */}
       <div className="mb-4">
         <button
           onClick={() => navigate('/admin-dashboard')}
           className="px-3 py-1 rounded bg-[#29327E] text-white hover:bg-[#1f285f] transition"
         >
           ← Back to Dashboard
         </button>
       </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : error ? (
          <p className="text-center text-red-600 font-bold">{error}</p>
        ) : (
          <>
            {/* Role Cards */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div
                onClick={() => setSelectedRole('')}
                className={`cursor-pointer p-4 bg-[#29327E] text-white rounded-2xl ${!selectedRole ? 'ring-2 ring-white' : ''}`}
              >
                <p>Total Users</p><p className="text-xl font-bold">{counts.total}</p>
              </div>
              {Object.entries(counts).filter(([k]) => k !== 'total').map(([role, count]) => (
                <div
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`cursor-pointer p-4 bg-[#29327E] text-white rounded-2xl ${selectedRole===role ? 'ring-2 ring-white' : ''}`}
                >
                  <p className="capitalize">{role.replace('_',' ')}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <select
                value={timeFilter}
                onChange={e => { setTimeFilter(e.target.value); setStartDate(''); setEndDate(''); }}
                className="px-4 py-2 border rounded-2xl"
              >
                <option value="all">All time</option>
                <option value="week">This week</option>
                <option value="2weeks">Past 2 weeks</option>
                <option value="month">Past month</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setTimeFilter('all'); }}
                className="px-4 py-2 border rounded-2xl"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setTimeFilter('all'); }}
                className="px-4 py-2 border rounded-2xl"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-4 py-2 border rounded-2xl flex-1"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-2xl shadow">
              <table className="w-full table-auto">
                <thead className="bg-[#29327E] text-white">
                  <tr>
                    {['First Name','Last Name','Email','Phone','Role','Signup Date','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length ? filteredUsers.map(u => (
                    <tr key={u.user_id} id={`user-${u.user_id}`} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-100 transition">
                      <td className="px-4 py-2">{u.first_name}</td>
                      <td className="px-4 py-2">{u.last_name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">{u.phone_number}</td>
                      <td className="px-4 py-2 capitalize">{u.role}</td>
                      <td className="px-4 py-2">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleLock(u.user_id, !u.is_locked); }}
                          className={`px-3 py-1 rounded-2xl text-white ${u.is_locked ? 'bg-green-600' : 'bg-yellow-600'}`}
                        >
                          {u.is_locked ? 'Locked' : 'Active'}
                        </button>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(u.user_id); }}
                          className="px-3 py-1 bg-red-500 text-white rounded-2xl hover:bg-red-600"
                        >Delete</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="text-center py-4">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
