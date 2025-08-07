import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaUser } from "react-icons/fa";
import { useAppContext } from "../../context/AppContext";
import { fetchProfile, saveProfile, toFormData } from "./UserProfile";

const PersonalDetails = () => {
  const { userData, updateUserProfile } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    image: null,
    county: "",
    city: "",
    town: "",
    zip: "",
    alternate_phonenumber: "",
    alternate_email: "",
  });

  useEffect(() => {
    if (!userData) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await fetchProfile(userData.user_id);
        setForm({
          first_name: data.first_name || userData.first_name || "",
          last_name: data.last_name || userData.last_name || "",
          email: data.email || userData.email || "",
          image: data.profile_pic || userData.image || null,
          county: data.county || "",
          city: data.city || "",
          town: data.town || "",
          zip: data.zip_code || "",
          alternate_phonenumber: data.alternate_phonenumber || "",
          alternate_email: data.alternate_email || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting user_id:", userData?.user_id);
    if (!userData) return alert("User not logged in");

    setLoading(true);
    try {
      const formData = toFormData(form, userData.user_id);
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      const result = await saveProfile(formData);
      console.log("saveProfile result:", result);

      
      if (!result || typeof result !== "object" || !("profile" in result)) {
        console.error("Unexpected saveProfile response:", result);
        throw new Error("Invalid profile data received after save");
      }

      const updated = result.profile;

      updateUserProfile(updated);  
      setForm((f) => ({
        ...f,
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
        email: updated.email || "",
        image: updated.profile_pic || null,
        county: updated.county || "",
        city: updated.city || "",
        town: updated.town || "",
        zip: updated.zip_code || "",
        alternate_phonenumber: updated.alternate_phonenumber || "",
        alternate_email: updated.alternate_email || "",
      }));

      setEditing(false);
      setTimeout(() => {
        alert("Profile updated successfully!");
      }, 100);
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );

  return (
    <div className="flex items-start justify-center min-h-screen pt-10">
      <div className="p-4 border rounded-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Personal Details
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your personal information, address, and contact details.
        </p>

        {!editing ? (
          <>
            {form.image ? (
              <img
                src={
                  form.image instanceof File
                    ? URL.createObjectURL(form.image)
                    : form.image
                }
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                <FaUser className="text-2xl text-gray-600" />
              </div>
            )}
            <h3 className="text-lg font-bold mt-4">
              {form.first_name} {form.last_name}
            </h3>
            <p className="text-gray-700">
              <FaEnvelope className="inline mr-2" />
              {form.email || "N/A"}
            </p>
            <h4 className="font-semibold text-lg mt-6">
              <FaMapMarkerAlt className="inline mr-2" />
              Address
            </h4>
            <p className="text-gray-700">
              {form.town}, {form.city}, {form.county} {form.zip}
            </p>
            <h4 className="font-semibold text-lg mt-6">
              <FaPhoneAlt className="inline mr-2" />
              Contact
            </h4>
            <p className="text-gray-700">
              Phone: {form.alternate_phonenumber || "N/A"}
            </p>
            <p className="text-gray-700">
              Alternate Email: {form.alternate_email || "N/A"}
            </p>
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-lg mt-6"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div
                className={`w-32 h-32 relative rounded-full flex items-center justify-center ${
                  form.image ? "" : "bg-gray-200"
                }`}
              >
                {form.image ? (
                  <img
                    src={
                      form.image instanceof File
                        ? URL.createObjectURL(form.image)
                        : form.image
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <FaUser className="text-gray-500 text-4xl" />
                )}
                <label
                  htmlFor="imageUpload"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </label>
              </div>
              <input
                id="imageUpload"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />
            </div>

            {["first_name", "last_name", "email"].map((field) => (
              <div key={field}>
                <label className="block text-gray-700 mb-2 capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  name={field}
                  type={field === "email" ? "email" : "text"}
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                />
              </div>
            ))}

            {["county", "city", "town", "zip"].map((field) => (
              <div className="mb-4" key={field}>
                <label className="block text-gray-700 mb-2 capitalize">
                  {field}
                </label>
                <input
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                />
              </div>
            ))}

            {["alternate_phonenumber", "alternate_email"].map((field) => (
              <div key={field}>
                <label className="block text-gray-700 mb-2 capitalize">
                  {field.replace("_", " ")}
                </label>
                <input
                  name={field}
                  type={field.includes("email") ? "email" : "text"}
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                />
              </div>
            ))}

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                disabled={loading}
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-500 text-white rounded-lg"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PersonalDetails;
