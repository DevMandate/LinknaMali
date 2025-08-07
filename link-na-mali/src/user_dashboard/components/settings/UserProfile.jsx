// services/userProfile.js
import axios from "axios";

export async function fetchProfile(userId) {
  try {
    const res = await axios.get(
      `https://api.linknamali.ke/getuserprofile/${userId}`,
      { withCredentials: true }
    );

    if (!res.data || !res.data.data) {
      console.error("Unexpected fetchProfile response:", res.data);
      throw new Error("Invalid profile data received");
    }

    return res.data.data;

  } catch (err) {
    console.error("fetchProfile error:", err.response?.data || err.message);
    throw new Error("Failed to fetch user profile");
  }
}

export async function saveProfile(formData) {
  try {
    const res = await axios.post(
      "https://api.linknamali.ke/userprofile",
      formData,
      { withCredentials: true }
    );

    const profile = res.data.user_profile;

    if (!profile || typeof profile !== "object") {
      console.error("Unexpected saveProfile response:", res.data);
      throw new Error("Invalid profile data received after save");
    }

    return { profile };  

  } catch (err) {
    console.error("saveProfile error:", err.response?.data || err.message);
    throw new Error("Failed to save user profile");
  }
}

export function toFormData(obj, userId) {
  const fd = new FormData();
  fd.append("user_id", userId);

  Object.entries(obj).forEach(([k, v]) => {
    if (k === "image" && v instanceof File) {
      fd.append("profile_pic", v);
    } else if (k !== "image") {
      fd.append(k, v ?? "");
    }
  });

  return fd;
}
