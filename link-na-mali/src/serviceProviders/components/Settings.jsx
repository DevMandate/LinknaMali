import React, { useState, useEffect, useContext } from 'react';
import AppContext from '../context/ServiceProviderAppContext';

const API_BASE_URL = "https://api.linknamali.ke";

const Settings = () => {
  const { userData } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => console.log("User Data from context:", userData), [userData]);

  useEffect(() => {
    if (!userData?.user_id) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/serviceprovidersuserid?user_id=${userData.user_id}`,
          { method: 'GET', credentials: 'include' }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setProfile(data[0] || null);
      } catch (e) {
        console.error(e);
        setErrorMsg(e.message);
      }
    })();
  }, [userData]);

  const handleUpdateProfile = e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const updatedData = Object.fromEntries(
      ['business_name','category','description','location','phone_number','email'].map(f => [f, form.get(f)])
    );
    console.log('Updated profile data:', updatedData);
  };

  if (!userData) return <div className="p-4 bg-gray-50 min-h-screen"><p>Loading user data...</p></div>;
  if (errorMsg) return <div className="p-4 bg-gray-50 min-h-screen"><p className="text-red-500">Error: {errorMsg}</p></div>;
  if (!profile) return <div className="p-4 bg-gray-50 min-h-screen"><p>No profile data available.</p></div>;

  const ProfileCard = () => (
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 w-full max-w-md mx-auto">
      {profile.media?.[0]?.media_url ? (
        <img src={profile.media[0].media_url} alt="Profile" className="w-24 sm:w-32 h-24 sm:h-32 rounded-full mx-auto" />
      ) : (
        <div className="w-24 sm:w-32 h-24 sm:h-32 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
          <span className="text-gray-600">No Image</span>
        </div>
      )}
      <div className="mt-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{profile.business_name}</h2>
        <p className="text-sm sm:text-lg text-blue-500 font-semibold">{profile.category}</p>
      </div>
      <div className="mt-6 space-y-2 text-sm sm:text-base">
        <p><strong>Description:</strong> {profile.description}</p>
        <p><strong>Location:</strong> {profile.location}</p>
        <p><strong>Phone:</strong> {profile.phone_number}</p>
        <p><strong>Email:</strong> {profile.email}</p>
      </div>
    </div>
  );

  const UpdateProfileForm = () => (
    <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl shadow-md p-6 sm:p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Update Profile</h2>
      {['business_name','category','description','location','phone_number','email'].map(f => (
        <div key={f} className="mb-4">
          <label className="block text-gray-700 capitalize mb-1">{f.replace('_',' ')}</label>
          {f === 'description' ? (
            <textarea name={f} defaultValue={profile[f]} className="w-full p-2 border rounded" />
          ) : (
            <input type={f==='email'?'email':'text'} name={f} defaultValue={profile[f]} className="w-full p-2 border rounded" />
          )}
        </div>
      ))}
      <button type="submit" className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save Changes</button>
    </form>
  );

  const AppearanceSettings = () => (
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Appearance Settings</h2>
      <div className="flex justify-center items-center space-x-4">
        <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
        <button onClick={() => setDarkMode(!darkMode)} className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">
          Toggle Mode
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'} min-h-screen p-4 sm:p-6`}>  
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row">
        <aside className="w-full sm:w-1/3 lg:w-64 mb-4 sm:mb-0">
          <div className="flex flex-col space-y-2">
            {[
              { key: 'profile', label: 'My Profile' },
              { key: 'update-profile', label: 'Update Profile' },
              { key: 'appearance', label: 'Dark/Light Mode' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full py-2 px-4 text-center rounded text-white bg-blue-500 hover:bg-blue-600 focus:outline-none ${activeTab === item.key && 'ring-2 ring-blue-300'}`}
              >{item.label}</button>
            ))}
          </div>
        </aside>

        <main className="flex-1 w-full">
          {activeTab === "profile" && <ProfileCard />}
          {activeTab === "update-profile" && <UpdateProfileForm />}
          {activeTab === "appearance" && <AppearanceSettings />}
        </main>
      </div>
    </div>
  );
};

export default Settings;
