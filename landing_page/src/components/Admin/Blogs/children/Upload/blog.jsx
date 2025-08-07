import React, { useState, useEffect } from "react";
import { Typography, Input } from "@mui/material";
import StandardButton from "../../../../Common/MUI_Button_Custom/standard";

const Blog = ({setFormData, handleUpload, searchEngine}) => {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const [assets, setAssets] = useState([]);

  const handleAssetsChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAssets(files);
  };

  // Allowed file types
  const allowedDocFormats = ["html"];

  // Handle document upload
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!allowedDocFormats.includes(fileExt)) {
      setError("Invalid document format. Only HTML files are allowed.");
      setDocument(null);
      e.target.value = "";
    } else {
      setError(null);
      setDocument(file);
    }
  };
  
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      document,
      assets,
    }));
  }, [document, assets]);

  const handleComplete = (e) => {
    e.preventDefault();
    if (!document || assets.length === 0) {
      setError("All fields are required.");
      return;
    }  
    handleUpload();
  };
  

  return (
    <>
      {error && <Typography color="error">{error}</Typography>}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Document Upload */}
        <Typography variant="h6" sx={{ marginTop: "16px" }}>
        Upload Your Blog .html
        </Typography>
        <Typography variant="body2" color="gray">
          Your blog must be in HTML format. No other formats are allowed.
        </Typography>
        <Input type="file" inputProps={{ accept: ".html" }}  onChange={handleDocumentChange} sx={{color:'var(--text)'}}/>
        {document && <Typography variant="body1">Selected Document: <span className="text-[var(--merime-theme)]">{document.name}</span></Typography>}

        {/* Assets Upload */}
        <Typography variant="h6" sx={{mt:2}}>Upload Image Assets</Typography>
        <Typography variant="body2" color="gray">
          If your extracted folder contains images, upload all image assets here.
        </Typography>
        <Input type="file" inputProps={{ multiple: true, accept: "image/*" }} onChange={handleAssetsChange} sx={{color:'var(--text)'}}/>
        {assets.length > 0 && (
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {assets.map((image, index) => (
              <div key={index} style={{ textAlign: "center" }}>
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index}`}
                  style={{ width: "100px", height: "100px", borderRadius: "2px", objectFit:'cover' }}
                />
                <h3 
                  variant="body2" 
                  style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >{image.name}
                </h3>
              </div>
            ))}
          </div>
        )}
        <StandardButton isloading={searchEngine}  onClick={handleComplete} text='Upload to cloudflare' sx={{ mt: 2 }} />
      </div>
    </>
  );
};

export default Blog;
