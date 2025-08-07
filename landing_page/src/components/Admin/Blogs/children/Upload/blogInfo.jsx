import React, { useState } from "react";
import { Typography, Input } from "@mui/material";
import CustomTextField from '../../../../Common/MUI_Text_Custom/customTextField';
import BasicButton from '../../../../Common/MUI_Button_Custom/basic';
import CustomSelectField from '../../../../Common/MUI_Text_Custom/customSelectField'

const BlogInfo = ({handleNextStep,setFormData}) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [blog_class, setBlogClass] = useState("");
  const [error, setError] = useState(null);

  // Allowed file types
  const allowedImageFormats = ["jpg", "jpeg", "png", "webp"];

  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!allowedImageFormats.includes(fileExt)) {
      setError("Invalid image format. Allowed formats: JPG, PNG, WEBP.");
      setThumbnail(null);
      e.target.value = "";
    } else {
      setError(null);
      setThumbnail(file);
    }
  };

  const handleNext =(e)=>{
    e.preventDefault();
    if (!title || !description || !thumbnail) {
      setError("All fields are required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      blog_class : blog_class,
      author : author,
      title : title,
      description : description,
      thumbnail : thumbnail,
    }));
    handleNextStep();
  }

  return (
    <>
      {error && <Typography color="error">{error}</Typography>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Typography variant="h6">Upload New Blog</Typography>
        <CustomSelectField
            id="role"
            name="role"
            label="Select the type of blog to upload..."
            value={blog_class}
            onChange={(e) => setBlogClass(e.target.value)}
            required
            options={[
                { value: "0", label: "Story Za Mitaa" },
                { value: "1", label: "Property Information and opportunities" },
            ]}
        />
        <CustomTextField
          label="Enter the author's name..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          sx={{ margin: '10px 0px 20px 0px' }}
          required
        />

        <CustomTextField
          label="Enter the blog title or headline..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ margin: '10px 0px 20px 0px' }}
          required
        />

        <CustomTextField
          label="Write a short description or summary..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          sx={{ margin: '10px 0px 20px 0px' }}
          required
        />

        {/* Thumbnail Upload */}
        <Typography variant="h6">
        Upload Thumbnail
        </Typography>
        <Typography variant="body2" color="gray">
        Thumbnails will be displayed alongside your blog post to give a quick visual preview.
        </Typography>
        <Input type="file" inputProps={{ accept: "image/*" }} onChange={handleThumbnailChange} sx={{color:'var(--text)'}}/>
        {thumbnail && (
        <div style={{ marginTop: "8px" }}>
            <img 
            src={URL.createObjectURL(thumbnail)} 
            alt="Thumbnail Preview" 
            style={{ width: "100px", height: "100px", borderRadius: "5px", objectFit:'cover' }}
            />
            <Typography variant="body2">{thumbnail.name}</Typography>
        </div>
        )}
        <BasicButton onClick={handleNext} text='Next' sx={{ mt: 2 }} />
      </div>
    </>
  );
};

export default BlogInfo;
