import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAppContext } from '../../context/AppContext'

axios.defaults.baseURL = 'https://api.linknamali.ke'
axios.defaults.withCredentials = true

export default function CompanyDashboard() {
  const { userData, setUserData } = useAppContext()
  const userId = userData?.user_id

  // ─── STATE ─────────────────────────────────────────────────────────────────
  const [company, setCompany] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState({ company: false, users: false, action: false })
  const [message, setMessage] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  // Create / Edit form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteErrors, setInviteErrors] = useState({})

   // ─── 1) FETCH “MY COMPANY” ────────────────────────────────────────────────
  const fetchMyCompany = useCallback(async () => {
    if (!userId) return;
    setLoading(s => ({ ...s, company: true }));
    try {
      const res = await axios.get('/getmycompany', { params: { user_id: userId } });
      if (res.data?.company) {
        setCompany(res.data.company);
        setUserData(u => ({ ...u, company_id: res.data.company.company_id }));
      } else {
        setCompany(null);
        setUserData(u => ({ ...u, company_id: null }));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setCompany(null);
        setUserData(u => ({ ...u, company_id: null }));
      } else {
        setMessage({ type: 'error', text: 'Could not load company.' });
      }
    } finally {
      setLoading(s => ({ ...s, company: false }));
    }
  }, [userId]);

  useEffect(() => {
    fetchMyCompany();
  }, [fetchMyCompany]);

  // ─── 2) FETCH COMPANY USERS VIA NEW ENDPOINT ───────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!company?.company_id) return setUsers([])
    setLoading(s => ({ ...s, users: true }))
    try {
      // Updated to use /get-company-users/<company_id>
      const res = await axios.get(`/get-company-users/${company.company_id}`)
      // API returns: { company_id, total_users, users: [ { user_id, name, email, role, is_accepted, invited_by, invited_on }, ... ] }
      setUsers(Array.isArray(res.data.users) ? res.data.users : [])
    } catch (err) {
      // 404 or no users → just show empty array
      setUsers([])
    } finally {
      setLoading(s => ({ ...s, users: false }))
    }
  }, [company])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ─── 3) HANDLE CREATE COMPANY ─────────────────────────────────────────────
  const handleCreate = async e => {
    e.preventDefault()
    if (!name.trim()) return setErrors({ name: 'Required' })
    setLoading(s => ({ ...s, action: true }))
    setMessage(null)
    try {
      const { data } = await axios.post(
        '/createcompany',
        {
          user_id: userId,
          name: name.trim(),
          email: email.trim() || undefined,
          phone_number: phone.trim() || undefined,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
      setMessage({ type: 'success', text: data.message || 'Created.' })
      setName(''); setEmail(''); setPhone(''); setErrors({})
      await fetchMyCompany()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error.' })
    } finally {
      setLoading(s => ({ ...s, action: false }))
    }
  }

  // ─── 4) EDIT MODE TOGGLES ──────────────────────────────────────────────────
  const startEdit = () => {
    if (!company) return
    setIsEditing(true)
    setName(company.name || '')
    setEmail(company.email || '')
    setPhone(company.phone_number || '')
    setErrors({})
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!name.trim()) return setErrors({ name: 'Required' })
    setLoading(s => ({ ...s, action: true }))
    setMessage(null)
    try {
      const { data } = await axios.put(
        '/updatecompany',
        {
          company_id: company.company_id,
          name: name.trim(),
          email: email.trim() || undefined,
          phone_number: phone.trim() || undefined,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
      setMessage({ type: 'success', text: data.message || 'Updated.' })
      setIsEditing(false)
      await fetchMyCompany()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error.' })
    } finally {
      setLoading(s => ({ ...s, action: false }))
    }
  }

  // ─── 5) DELETE COMPANY ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!company || !window.confirm('Delete this company?')) return
    setLoading(s => ({ ...s, action: true }))
    setMessage(null)
    try {
      await axios.delete(`/company/${company.company_id}`)
      setMessage({ type: 'success', text: 'Deleted.' })
      setCompany(null)
      setUsers([])
      setUserData(u => ({ ...u, company_id: null }))
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting.' })
    } finally {
      setLoading(s => ({ ...s, action: false }))
    }
  }

  // ─── 2) INVITE NEW USER ────────────────────────────────────────────────────
const handleInvite = async e => {
  e.preventDefault();
  const errors = {};
  if (!inviteEmail.trim())          errors.email      = 'Required';
  if (!inviteRole)                  errors.role       = 'Required';
  if (!userData.company_id)         errors.company_id = 'No company selected';
  if (Object.keys(errors).length) {
    setInviteErrors(errors);
    return;
  }

  setLoading(s => ({ ...s, action: true }));
  setMessage(null);
  const payload = {
    email:      inviteEmail.trim(),       
    company_id: userData.company_id,
    invited_by: userId,                    
    role:       inviteRole
  };

  console.log('Invite payload:', payload);

  try {
    const { data } = await axios.post(
      'https://api.linknamali.ke/invite-user',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    setMessage({ type: 'success', text: data.response });
    setInviteEmail('');
    setInviteRole('member');
    setInviteErrors({});
    setShowInvite(false);
    await fetchUsers();

  } catch (err) {
    if (err.response?.status === 400) {
      setMessage({ type: 'error', text: err.response.data.response });
    } else {
      setMessage({ type: 'error', text: 'Unexpected error. Please try again.' });
    }
  } finally {
    setLoading(s => ({ ...s, action: false }));
  }
};


    // ─── 7) REMOVE USER FROM COMPANY ──────────────────────────────────────────
  const handleRemoveUser = async targetUserId => {                          
    if (!window.confirm('Remove this user from the company?')) return;
    setLoading(s => ({ ...s, action: true }));                            
    setMessage(null);                                                      
    try {                                                                 
      await axios.delete(                                                  
        '/remove-user-from-company',                                     
        {                                                                  
          data: {                                                         
            admin_user_id: userId,                                        
            target_user_id: targetUserId,                                  
          },                                                               
          headers: { 'Content-Type': 'application/json' },                 
        }                                                                  
      );                                                                   
      setMessage({ type: 'success', text: 'User removed successfully.' }); 
      await fetchUsers();                                                  
    } catch (err) {                                                       
      setMessage({ type: 'error', text: err.response?.data?.message ||     
        'Error removing user.' });                                        
    } finally {                                                            
      setLoading(s => ({ ...s, action: false }));                        
    }                                                                     
  }                                                                        


  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      className="max-w-3xl mx-auto mt-12 space-y-8 px-4 sm:px-6 lg:px-8"
      style={{ '--primary-color': '#29327E', '--secondary-color': '#35BEBD' }}
    >
      {/* GLOBAL MESSAGE */}
      {message && (
        <div
          className="rounded-md p-4"
          style={{
            backgroundColor: message.type === 'success' ? 'rgba(41,50,126,0.1)' : 'rgba(53,190,189,0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--primary-color)' : 'var(--secondary-color)'}`,
            color: message.type === 'success' ? 'var(--primary-color)' : 'var(--secondary-color)',
          }}
        >
          {message.text}
        </div>
      )}

      {/* LOADING COMPANY CHECK */}
      {loading.company ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : company ? (
        <>
          {/* ───── COMPANY DETAILS CARD ─────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--primary-color)' }}>
                Company Details
              </h2>
              {!isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={startEdit}
                    className="px-3 py-1 rounded-md text-white"
                    style={{ backgroundColor: 'var(--secondary-color)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading.action}
                    className="px-3 py-1 rounded-md text-white"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    {loading.action ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="font-medium">Name</p>
                  <p>{company.name || '—'}</p>
                </div>
                {company.email && (
                  <div>
                    <p className="font-medium">Email</p>
                    <p>{company.email}</p>
                  </div>
                )}
                {company.phone_number && (
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>{company.phone_number}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Status</p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor:
                        company.status === 'active' ? 'rgba(41,50,126,0.1)' : 'rgba(107,114,128,0.1)',
                      color: company.status === 'active' ? 'var(--primary-color)' : '#6B7280',
                    }}
                  >
                    {company.status === 'active' ? 'Active' : company.status || 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setErrors(s => ({ ...s, name: null }))
                    }}
                    className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    type="text"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring"
                    type="tel"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading.action}
                    className="px-4 py-2 rounded-md text-white"
                    style={{ backgroundColor: 'var(--secondary-color)' }}
                  >
                    {loading.action ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setErrors({})
                    }}
                    className="px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ───── USERS & INVITE CARD ─────────────────────────────── */}
         <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-2xl font-semibold" style={{ color: 'var(--primary-color)' }}>
      Company Users
    </h3>
    <button
      onClick={() => {
        setShowInvite(s => !s)
        setInviteErrors({})
        setMessage(null)
      }}
      className="px-3 py-1 rounded-md text-white"
      style={{ backgroundColor: 'var(--secondary-color)' }}
    >
      {showInvite ? 'Hide Invite' : 'Invite New User'}
    </button>
  </div>
  <hr className="mb-4 border-gray-200" />

  {loading.users ? (
    <p className="text-center text-gray-600">Loading users…</p>
  ) : users.length === 0 ? (
    <p className="text-center text-gray-500">No users yet.</p>
  ) : (
    <ul className="divide-y divide-gray-100">
      {users.map(u => (
        <li key={u.user_id} className="py-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-800">{u.name || '—'}</p>
            <p className="text-gray-500 text-sm">{u.email}</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Role badge */}
            <span
              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor:
                  u.role === 'manager'
                    ? 'rgba(41,50,126,0.1)'
                    : u.role === 'editor'
                    ? 'rgba(53,190,189,0.1)'
                    : 'rgba(209,213,219,0.1)',
                color:
                  u.role === 'manager'
                    ? 'var(--primary-color)'
                    : u.role === 'editor'
                    ? 'var(--secondary-color)'
                    : '#6B7280',
              }}
            >
              {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
            </span>

            <span className="text-xs text-gray-400">
              {new Date(u.invited_on).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <button
              disabled={loading.action}
              onClick={() => handleRemoveUser(u.user_id)}
              className="ml-2 px-2 py-1 rounded-md text-white text-sm"
              style={{ backgroundColor: '#E53E3E' }}
            >
              {loading.action ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )}


            {showInvite && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Invite New User</h4>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={inviteEmail}
                      onChange={e => {
                        setInviteEmail(e.target.value)
                        setInviteErrors(s => ({ ...s, invitee_email: null }))
                      }}
                      className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                        inviteErrors.invitee_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      type="email"
                    />
                    {inviteErrors.invitee_email && (
                      <p className="text-red-500 text-xs mt-1">{inviteErrors.invitee_email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={inviteRole}
                      onChange={e => {
                        setInviteRole(e.target.value)
                        setInviteErrors(s => ({ ...s, role: null }))
                      }}
                      className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                        inviteErrors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="manager">Manager</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {inviteErrors.role && (
                      <p className="text-red-500 text-xs mt-1">{inviteErrors.role}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading.action}
                    className="w-full px-4 py-2 rounded-md text-white"
                    style={{ backgroundColor: 'var(--secondary-color)' }}
                  >
                    {loading.action ? 'Sending…' : 'Send Invite'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      ) : (
        // ───── NO COMPANY → SHOW CREATE FORM ─────────────────────────────
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary-color)' }}>
            Create a Company
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setErrors(s => ({ ...s, name: null }))
                }}
                className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                type="text"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring"
                type="email"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring"
                type="tel"
              />
            </div>
            <button
              type="submit"
              disabled={loading.action}
              className="w-full px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: 'var(--secondary-color)' }}
            >
              {loading.action ? 'Submitting…' : 'Create'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
