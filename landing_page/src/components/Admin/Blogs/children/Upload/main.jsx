import React, { useState } from "react";
import { LinearProgress, Typography} from "@mui/material";
import { motion } from "framer-motion";
import {useSearchEngine} from '../../../../../context/SearchEngine'
import BlogInfo from "./blogInfo";
import Blog from './blog';
import axios from "axios";

const BlogManager = ({setActive}) => {
  const [formData, setFormData] = useState({
    blog_class: "",
    author: "",
    title: "",
    description: "",
    thumbnail: null,
    document: null,
    assets: [],
  });
  const [error, setError] = useState(null);
  const {searchEngine,setSearchEngine} = useSearchEngine();
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / 2) * 100;

  function handleNextStep() {
      if (step < 1) {
          setStep(step + 1);
      }
  }

    const handleUpload = async () => {
      try {
          setSearchEngine(true);
          console.log(formData);
          const response = await axios.post("https://api.linknamali.ke/blogs/createblog", formData, {
              headers: {
                  "Content-Type": "multipart/form-data",
              },
              withCredentials: true, // Include credentials if needed
          });

          console.log(response.data);

          if (response.status === 201) {
              setFormData({
                  title: "",
                  description: "",
                  thumbnail: null,
                  document: null,
                  assets: [],
              });
              setActive("grid");
          } else {
              setError(response.data.message || "Failed to create blog.");
          }
      } catch (error) {
          console.error("Error:", error);
          setError(error.response?.data?.message || "Server Error. Please try again later.");
      } finally {
          setSearchEngine(false);
      }
  };


  return (
    <div style={{ marginTop: "16px", paddingTop: "16px"}} className="">
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
      {error && <Typography color="error">{error}</Typography>}
      <motion.div
        key={step}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {step === 0 && <BlogInfo handleNextStep={handleNextStep} setFormData={setFormData}/>}
        {step === 1 && <Blog setFormData={setFormData} handleUpload={handleUpload} searchEngine={searchEngine}/>}
      </motion.div>
    </div>
  );
};

export default BlogManager;
