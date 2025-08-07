import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAppContext } from '../context/AdminAppContext';

const AdminProfile = () => {
  const { adminData, setAdminData } = useAdminAppContext();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    profilePicUrl: '',
    imageFile: null,
  });

  useEffect(() => {
    if (adminData) {
      setProfile({
        first_name: adminData.firstName || '',
        last_name: adminData.lastName || '',
        email: adminData.email || '',
        profilePicUrl: adminData.profilePicUrl || '',
        imageFile: null,
      });
    }
  }, [adminData]);

  const handleChange = e => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      setProfile(prev => ({
        ...prev,
        profilePicUrl: URL.createObjectURL(file),
        imageFile: file,
      }));
    }
  };

  const handleUpdate = async () => {
    if (!adminData) return;
    const formData = new FormData();
    formData.append('user_id', adminData.user_id);
    formData.append('first_name', profile.first_name);
    formData.append('last_name', profile.last_name);
    formData.append('email', profile.email);
    if (profile.imageFile) formData.append('profile_pic', profile.imageFile);

    setLoading(true);
    try {
      const res = await axios.post(
        'https://api.linknamali.ke/adminprofile',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const updated = res.data.admin_profile;
      setProfile(prev => ({
        ...prev,
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        profilePicUrl: updated.profile_pic || prev.profilePicUrl,
        imageFile: null,
      }));
      setAdminData(data => ({
        ...data,
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        profilePicUrl: updated.profile_pic || data.profilePicUrl,
      }));
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 space-y-6 text-center">
      {!editing ? (
        <div className="space-y-4">
          {profile.profilePicUrl ? (
            <img
              src={profile.profilePicUrl}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto border-4 border-teal-400 object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center border-4 border-teal-400">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          <h2 className="text-2xl font-semibold text-gray-800">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-600">{profile.email}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <label className="block mx-auto w-32 h-32 rounded-full overflow-hidden cursor-pointer">
            {profile.profilePicUrl ? (
              <img
                src={profile.profilePicUrl}
                alt="Upload"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {['first_name','last_name','email'].map(field => (
            <div key={field} className="">
              <label className="block text-gray-700 mb-1 capitalize" htmlFor={field}>
                {field.replace('_',' ')}
              </label>
              <input
                id={field}
                name={field}
                type={field === 'email' ? 'email' : 'text'}
                value={profile[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
