import { useState } from "react";
import { Typography, Button } from "@mui/material";
import { usePriorityDisplay } from "../../../context/PriorityDisplay";
import { useLogin } from "../../../context/IsLoggedIn";
import Upload from "./children/Upload/main";
import UploadGrid from './children/uploadGuide';
import BlogsGrid from "./children/blogsGrid";
import { motion, AnimatePresence } from "framer-motion";
import ReadBlog from "./children/readBlog";
import {scrollIntoView} from '../../../utils/scrollIntoView'

const BlogManager = () => {
  const { isLoggedIn } = useLogin();
  const { priorityDisplay } = usePriorityDisplay();
  const [active, setActive] = useState("grid"); // Default to BlogsGrid
  const [blog_to_read, setBlogToRead] = useState(null);

  const buttons = [
    { key: "grid", label: "View Blogs" },
    { key: "upload", label: "Upload Blog" },
    { key: "guide", label: "Upload Guide" },
  ];

  const handleClick = (key) => {
    setActive(key);
    scrollIntoView('header');
  }

  if (!isLoggedIn) return null;

  return (
    <div
      className="p-[20px]"
      style={{
        display: priorityDisplay === "blog-manager" ? "block" : "none",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Blog Manager
      </Typography>

      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-4">
        {buttons.map(({ key, label }) => (
          <Button
            key={key}
            variant={active === key ? "contained" : "outlined"}
            color="var(--text)"
            onClick={() => {handleClick(key)}}
            sx={{
              borderColor: active !== key ? "var(--merime-theme)" : undefined,
              backgroundColor: active === key ? "var(--merime-theme)" : undefined,
              color: active === key ? "var(--color-white)" : undefined,
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Animate Presence for smooth transitions */}
      <AnimatePresence mode="wait">
        {active === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <BlogsGrid setActive={setActive} setBlogToRead={setBlogToRead} />
          </motion.div>
        ) : active ==='upload'? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Upload setActive={setActive} />
          </motion.div>
        ) : active ==='read'? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <ReadBlog blog={blog_to_read}/>
          </motion.div>
          ) : (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <UploadGrid/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManager;
