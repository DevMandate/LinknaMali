import React, { useState } from 'react';

const AdminSignUp = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(0);
  const [newAdminData, setNewAdminData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    password1: '', password2: '', role: 'admin'
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailForOTP, setEmailForOTP] = useState('');

  const handleChange = e => {
    setNewAdminData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePasswordStrength = pwd =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

  const handleRegisterAdmin = async () => {
    if (newAdminData.password1 !== newAdminData.password2) {
      setError('Passwords do not match.'); return;
    }
    if (!validatePasswordStrength(newAdminData.password1)) {
      setError('Password must be 8+ chars, include upper, lower, number, special.'); return;
    }
    setError('');
    const payload = { ...newAdminData };
    try {
      const res = await fetch('https://api.linknamali.ke/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setEmailForOTP(newAdminData.email);
        setStep(1);
      } else setError(data.response || 'Registration failed.');
    } catch {
      setError('Error communicating with server.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setError('Please enter the OTP.'); return; }
    setError('');
    try {
      const res = await fetch('https://api.linknamali.ke/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOTP, otp })
      });
      const data = await res.json();
      if (res.ok) onSuccess && onSuccess(data);
      else setError(data.response || 'OTP verification failed.');
    } catch {
      setError('Error communicating with server.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
      {step === 0 ? (
        <>
          <h2 className="text-xl font-semibold text-[#29327E] text-center">Register New Admin</h2>
          {error && <p className="text-center text-red-600">{error}</p>}
          <div className="space-y-4">
            {['first_name','last_name','email','phone_number'].map(field => (
              <div key={field}>
                <label className="block text-[#29327E] mb-1 capitalize" htmlFor={field}>{field.replace('_',' ')}</label>
                <input
                  id={field}
                  name={field}
                  type={field.includes('email')?'email': field.includes('phone')?'tel':'text'}
                  value={newAdminData[field]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
                  placeholder={`Enter ${field.replace('_',' ')}`}  
                />
              </div>
            ))}
            {['password1','password2'].map((pwdField, i) => (
              <div key={pwdField}>
                <label className="block text-[#29327E] mb-1" htmlFor={pwdField}>{i===0?'Password':'Confirm Password'}</label>
                <div className="flex items-center">
                  <input
                    id={pwdField}
                    name={pwdField}
                    type={i===0?(showPassword?'text':'password'):(showConfirmPassword?'text':'password')}
                    value={newAdminData[pwdField]}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
                    placeholder={i===0?'Enter password':'Confirm password'}
                  />
                  <button
                    type="button"
                    onClick={() => i===0?setShowPassword(prev=>!prev):setShowConfirmPassword(prev=>!prev)}
                    className="ml-2 text-[#29327E]"
                  >{i===0?(showPassword?'Hide':'Show'):(showConfirmPassword?'Hide':'Show')}</button>
                </div>
              </div>
            ))}
            <div>
              <label className="block text-[#29327E] mb-1" htmlFor="role">Select Role</label>
              <select
                id="role"
                name="role"
                value={newAdminData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={handleRegisterAdmin}
              className="px-4 py-2 bg-[#29327E] text-white rounded-2xl hover:bg-[#1f285f] transition"
            >
              Register Admin
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-[#35BEBD] text-white rounded-2xl hover:bg-[#2ca8a6] transition"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-[#29327E] text-center">Verify Your Email</h2>
          <p className="text-[#29327E] text-center">OTP sent to <span className="font-medium">{emailForOTP}</span></p>
          {error && <p className="text-center text-red-600">{error}</p>}
          <div>
            <label htmlFor="otp" className="block text-[#29327E] mb-1">OTP</label>
            <input
              id="otp"
              value={otp}
              onChange={e=>setOtp(e.target.value)}
              className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#35BEBD]"
              placeholder="Enter OTP"
            />
          </div>
          <div className="flex justify-between">
            <button
              onClick={handleVerifyOtp}
              className="px-4 py-2 bg-[#35BEBD] text-white rounded-2xl hover:bg-[#2ca8a6] transition"
            >
              Verify OTP
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-[#29327E] text-white rounded-2xl hover:bg-[#1f285f] transition"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSignUp;
