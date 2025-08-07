import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CompanyInviteHandler() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Primary invite‐handling function
  const handleInvite = async (token) => {
    try {
      console.log('▶️ Invite token from URL:', token);
      // 2) Validate token & fetch the invite’s user data via GET
      const response = await axios.get(
        'https://api.linknamali.ke/company-invite-login',
        { params: { token } }
      );
      console.log('✅ User data fetched from token:', response.data);
      setUserData(response.data);
    } catch (err) {
      console.error('❌ Error fetching invitation data:', err);
      setError('Failed to fetch invitation data');
    } finally {
      setLoading(false);
    }
  };

  // Continue handling: login or accept invite
  const continueInvite = async () => {
    if (!userData) return;
    setProcessing(true);
    const token = userData.invitation_token;
    try {
      if (!userData.token_valid) {
        return navigate('/invite-expired');
      }
      // 3) Check auth state
      const storedUser = localStorage.getItem('user');
      const authToken = localStorage.getItem('token');
      console.log('ℹ️ Current stored user:', storedUser);
      console.log('ℹ️ Current auth token:', authToken);
      // 4) If no one’s logged in yet
      if (!storedUser || !authToken) {
        console.log('🔐 No logged-in user, storing inviteToken and redirecting to /login');
        localStorage.setItem('inviteToken', token);
        return navigate('/login');
      }
      // 5) Already authenticated → accept the invite
      console.log('🔄 User is logged in, calling accept-invite endpoint');
      await axios.post(
        'https://api.linknamali.ke/company/accept-invite',
        { invitation_token: token },
        { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
      );
      console.log('🎉 Invite accepted, redirecting to /user-dashboard');
      navigate('/user-dashboard');
    } catch (err) {
      console.error('❌ Error in invite flow:', err);
      navigate('/invite-expired');
    } finally {
      setProcessing(false);
    }
  };

  // After login, resume flow if we saved an inviteToken
  const postLoginInvite = async () => {
    const saved = localStorage.getItem('inviteToken');
    console.log('▶️ inviteToken retrieved after login:', saved);
    if (saved) {
      localStorage.removeItem('inviteToken');
      try {
        const authToken = localStorage.getItem('token');
        console.log('🔄 Resuming invite acceptance with saved token');
        await axios.post(
          'https://api.linknamali.ke/company/accept-invite',
          { invitation_token: saved },
          { headers: { Authorization: `Bearer ${authToken}` }, withCredentials: true }
        );
        console.log('🎉 Invite accepted post-login, redirecting to /user-dashboard');
        return navigate('/user-dashboard');
      } catch (err) {
        console.error('❌ Post-login invite error:', err);
        return navigate('/invite-expired');
      }
    }
    // No saved token → fetch user data
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      console.warn('❌ No token in URL, redirecting to 404');
      return navigate('/404');
    }
    handleInvite(token);
  };

  useEffect(() => {
    postLoginInvite();
  }, [navigate]);

  if (loading) {
    return <p>Loading invitation data…</p>;
  }
  if (error) {
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Show fetched data and Continue button
  return (
    <div className="invite-info">
      <h2>Invitation Data</h2>
      <pre style={{ background: '#f4f4f4', padding: '10px' }}>
        {JSON.stringify(userData, null, 2)}
      </pre>
      <button onClick={continueInvite} disabled={processing}>
        {processing ? 'Processing…' : 'Continue'}
      </button>
    </div>
  );
}
