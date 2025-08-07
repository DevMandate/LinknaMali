import React, { useState } from "react";
import axios from "axios";
import { Avatar, IconButton, Box, useMediaQuery } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLogin } from "../../../../context/IsLoggedIn";
import StandardButton from "../../../Common/MUI_Button_Custom/standard";
import { useSearchEngine } from "../../../../context/SearchEngine";

export default function Profile() {
  const { userData } = useLogin();
  const { searchEngine, setSearchEngine } = useSearchEngine();
  const isMobile = useMediaQuery("(max-width:1260px)");

  const [profilePic, setProfilePic] = useState(userData?.profile_pic_url);
  const [editing, setEditing] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Handle file selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
      setNewImage(file);
      setEditing(true);
    }
  };

  // Upload new profile picture
  const handleSubmit = async () => {
    if (!newImage) return;

    try {
      setSearchEngine(true);
      const formData = new FormData();
      formData.append("user_id", userData?.user_id);
      formData.append("profile_pic", newImage);

      const response = await axios.post(
        "https://api.linknamali.ke/auth/profile-pic/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSuccess(true);
      setEditing(false);
    } catch (error) {
      setError('Profile picture cannot be uploaded. Try again later');
    } finally {
      setSearchEngine(false);
    }
  };

  // Delete profile picture
  const handleDelete = async () => {
    if (newImage) {
      // Reset to original image if user hasn't saved changes
      setProfilePic(userData?.profile_pic_url);
      setNewImage(null);
      setEditing(false);
    } else {
      try {
        setSearchEngine(true);
        const response = await axios.delete(
          "https://api.linknamali.ke/auth/profile-pic/delete",
          { data: { user_id: userData?.user_id } }
        );
        setProfilePic(null);
        setSuccess(true);
      } catch (error) {
        setError('Profile picture cannot be deleted. Try again later');
      } finally {
        setSearchEngine(false);
      }
    }
  };

  return (
    <div className="mb-[30px]">
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {success && <div className="text-[var(--merime-theme)] mb-4">Changes might take a few minutes to reflect</div>}
      <label>Change Profile Picture</label>
      <Box className="profile_pic">
        <Avatar src={profilePic} sx={{ width: "100%", height: "100%" }} />
        
        {/* Hover Overlay */}
        <Box className={`overlay upload_profile_pic ${isMobile ? "show-overlay" : ""}`}>
          {/* Upload Button */}
          <IconButton component="label" sx={{ color: "white" }}>
            <PhotoCameraIcon />
            <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          </IconButton>

          {/* Delete Button */}
          <IconButton sx={{ color: "white" }} onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Show Save Button only if a new image is uploaded */}
      {editing && (
        <StandardButton
          fullWidth={false} 
          onClick={handleSubmit}
          isloading={searchEngine} 
          sx={{ mt: 3 }}
          text="Save Changes"
        />
      )}
    </div>
  );
}
