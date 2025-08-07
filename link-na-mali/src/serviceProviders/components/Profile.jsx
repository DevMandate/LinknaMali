import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/ServiceProviderAppContext.jsx";

const API_BASE_URL = "https://api.linknamali.ke";

const ServiceProviderDashboard = () => {
  const { userData, markProfileComplete } = useContext(AppContext);
  const navigate = useNavigate();
  const userId = userData?.user_id ?? null;

  // Steps: intro | profile | media
  const [step, setStep] = useState("intro");
  // Profile multi-step sub-index
  const [profileStep, setProfileStep] = useState(0);

  // Profile form state
  const [profileData, setProfileData] = useState({
    business_name: "",
    category: "",
    description: "",
    location: "",
    phonenumber: "",
    email: "",
  });

  // Created profile ID
  const [profileId, setProfileId] = useState("");
  const [files, setFiles] = useState([]);

  // Define fields in order
  const fields = [
    { name: "business_name", label: "Business Name", type: "text" },
    { name: "category", label: "Category", type: "select", options: ["Movers", "Cleaners", "Lawyers", "Property Valuers", "Architects", "Land Surveyors"] },
    { name: "description", label: "Description", type: "textarea" },
    { name: "location", label: "Location", type: "text" },
    { name: "phonenumber", label: "Phone Number", type: "text" },
    { name: "email", label: "Email", type: "email" },
  ];

  // Chunk into pairs
  const pairs = [];
  for (let i = 0; i < fields.length; i += 2) {
    pairs.push(fields.slice(i, i + 2));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit profile data, return success flag
  const handleProfileSubmit = async () => {
    if (!userId) {
      alert("User not authenticated. Please log in.");
      return false;
    }
    const payload = { user_id: userId, ...profileData };
    try {
      const res = await fetch(`${API_BASE_URL}/serviceprofiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileId(data.profile_id);
        return true;
      } else {
        alert(`Error: ${data.error}`);
        return false;
      }
    } catch {
      alert("Error connecting to the server");
      return false;
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (profileStep < pairs.length - 1) {
      setProfileStep((prev) => prev + 1);
    } else {
      // Last chunk -> create profile then go to media
      const success = await handleProfileSubmit();
      if (success) setStep("media");
    }
  };

  const handleFileChange = (e) => setFiles(e.target.files);

  const handleMediaUpload = (e) => {
    e.preventDefault();
    if (!profileId) {
      alert("Please complete your profile first.");
      return;
    }
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("profile_id", profileId);
    Array.from(files).forEach((f) => formData.append("files", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/servicemedia`);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        console.log(`Upload: ${((evt.loaded / evt.total) * 100).toFixed(0)}%`);
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
          alert("Media uploaded successfully!");
          // update context and navigate
          markProfileComplete();
          navigate("/service-providers", { replace: true });
        } else {
          alert(`Upload Error: ${data.error}`);
        }
      } catch {
        alert("Error processing server response");
      }
    };
    xhr.onerror = () => alert("Error connecting to the server");
    xhr.send(formData);
  };

  // RENDERERS
  if (step === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Your Service Profile</h1>
          <p className="mb-6">
            Please fill out your profile accurately and upload clear, high‑quality images. Your profile is how clients find and trust you on our platform.
          </p>
          <button
            onClick={() => setStep("profile")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    const currentPair = pairs[profileStep];
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
        <form onSubmit={handleNext} className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Step {profileStep + 1} of {pairs.length}</h2>
          {currentPair.map((field) => (
            <div key={field.name} className="mb-4">
              <label className="block text-gray-700 mb-1">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={profileData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map((opt) => (
                    <option key={opt.toLowerCase()} value={opt.toLowerCase()}>{opt}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={profileData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={profileData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded p-2"
                  required
                />
              )}
            </div>
          ))}
          <button type="submit" className="bg-blue-500 text-white w-full py-2 rounded">
            {profileStep < pairs.length - 1 ? "Save & Continue" : "Save & Continue to Media"}
          </button>
        </form>
      </div>
    );
  }

  // media step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <form onSubmit={handleMediaUpload} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Upload Media</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Select Media Files (max 50MB)</label>
          <input type="file" multiple onChange={handleFileChange} className="w-full" />
        </div>
        <button type="submit" className="bg-green-500 text-white w-full py-2 rounded">
          Upload Files & Finish
        </button>
      </form>
    </div>
  );
};

export default ServiceProviderDashboard;
