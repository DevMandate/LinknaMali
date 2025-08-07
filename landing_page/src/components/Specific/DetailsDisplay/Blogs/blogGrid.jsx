import {useNavigate} from 'react-router-dom'
import { Card, CardContent, Typography } from "@mui/material";
import CircularProgress from "../../../Common/circularProgress";

const BlogGrid = ({loading, error, blogs}) => {
    const navigate = useNavigate();

    function handleBlogClick(blog) {
        navigate(`/blogs/read/${blog.id}`);
    }

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : error || blogs.length === 0 ? (
        <Typography variant="h5" sx={{ mt: 5 }} textAlign="center">{error || 'No blogs found'}</Typography>
      ) : (
        <div style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 400px))",
          gap: "20px",
        }}>
          {blogs.map((blog) => (
            <Card 
            key={blog.id} 
            onClick={() => handleBlogClick(blog)}
            sx={{ borderRadius: 2, boxShadow: 3, overflow: "hidden", backgroundColor: 'var(--hamburger)', color: 'var(--text)' }}>
              <img
                src={blog.thumbnail_url || ""}
                alt={blog.title}
                style={{ width: "100%", height: "150px", objectFit: "cover" }}
              />
              <CardContent>
                <Typography variant="h6">{blog.title}</Typography>
                <Typography variant="body1" gutterBottom sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {blog.description}
                </Typography>
                <Typography variant="body2">by {blog?.author}</Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default BlogGrid;
