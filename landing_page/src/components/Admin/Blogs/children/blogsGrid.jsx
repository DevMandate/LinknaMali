import { useState, useEffect } from "react";
import { Card, CardContent, Typography, Select, MenuItem, Chip, IconButton, Menu, Button } from "@mui/material";
import CircularProgress from "../../../Common/circularProgress";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";

const BlogGrid = ({setActive,setBlogToRead}) => {
  const [blogs, setBlogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const handleMenuOpen = (event, blog) => {
    setAnchorEl(event.currentTarget);
    setSelectedBlog(blog);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBlog(null);
  };

  const readBlog = (blog) => {
    setBlogToRead(blog);
    setActive("read");
  }

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get("https://api.linknamali.ke/blogs/get-all-blogs");
        setBlogs(response.data.data || []);
      } catch (err) {
        setError("No Blogs Available");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const togglePublishStatus = async (blog) => {
    console.log(blog);
    const url = `https://api.linknamali.ke/blogs/${blog.is_public ? "unpublish" : "publish"}/${blog.id}`;
    try {
      await axios.post(url);
      setBlogs(blogs.map(b => b.id === blog.id ? { ...b, is_public: !b.is_public } : b));
    } catch (err) {
      alert("Failed to update blog status.");
    } finally {
      handleMenuClose();
    }
  };

  const deleteBlog = async (blog) => {
    if (!window.confirm(`Are you sure you want to delete '${blog.title}'? This action cannot be undone.`)) return;
    try {
      await axios.delete(`https://api.linknamali.ke/blogs/delete/${blog.id}`);
      setBlogs(blogs.filter(b => b.id !== blog.id));
    } catch (err) {
      alert("Failed to delete blog.");
    } finally {
      handleMenuClose();
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    if (filter === "all") return true;
    if (filter === "public") return blog.is_public === true;
    if (filter === "private") return blog.is_public === false;
    if (filter === "story") return blog.blog_class === 0;
    if (filter === "propertyinfo") return blog.blog_class === 1;
    return true;
  });
  

  return (
    <>
      <div style={{ marginBottom: "16px"}}>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="private">Private</MenuItem>
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="story">Story Za Mtaa</MenuItem>
          <MenuItem value="propertyinfo">Property Information and opportunities</MenuItem>
        </Select>
      </div>

      {loading ? (
        <CircularProgress/>
      ) : error ? (
        <Typography textAlign="center" color="error">{error}</Typography>
      ) : filteredBlogs.length === 0 ? (
        <Typography variant="h5" sx={{mt:5}}>No blogs found.</Typography>
      ) : (
        <div style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 400px))",
          gap: "20px",
        }}>
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} sx={{ borderRadius: 2, boxShadow: 3, overflow: "hidden", position: "relative",backgroundColor: 'var(--hamburger)', color: 'var(--text)' }}>
              <img
                src={blog.thumbnail_url || ""}
                alt={blog.title}
                style={{ width: "100%", height: "150px", objectFit: "cover" }}
              />
              <div className="flex justify-between ">
                  <CardContent sx={{ maxWidth:'80%',wordBreak:'break-word' }}>
                    <Typography variant="h6">{blog.title}</Typography>
                    <Typography variant="body2" gutterBottom 
                    sx={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>{blog.description}
                    </Typography>
                    <Typography variant="body2">by {blog?.author}</Typography>
                    <Chip
                      label={blog.is_public ? "Public" : "Private"}
                      sx={{
                        mt: 1,
                        color: "white",
                        fontSize: "0.9rem",
                        backgroundColor: blog.is_public ? "var(--merime-theme)" : "gray",
                      }}
                    />
                  </CardContent>
                  <div className="mt-2">
                    <IconButton
                      aria-label="settings"
                      onClick={(event) => handleMenuOpen(event, blog)}
                      sx={{ color: "var(--text)" }}
                    ><MoreVertIcon />
                    </IconButton>
                    <Menu 
                      anchorEl={anchorEl} 
                      open={Boolean(anchorEl)} 
                      onClose={handleMenuClose}
                    >
                      {selectedBlog && (
                        <>
                          <MenuItem onClick={() => togglePublishStatus(selectedBlog)}>
                            {selectedBlog.is_public ? "Make Private" : "Publish to Public"}
                          </MenuItem>
                          <MenuItem onClick={() => readBlog(selectedBlog)}>Read Blog</MenuItem>
                          <MenuItem onClick={() => deleteBlog(selectedBlog)}>Delete Blog</MenuItem>
                        </>
                      )}
                    </Menu>
                  </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default BlogGrid;
