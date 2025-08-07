import { useEffect, useState } from "react";
import { Avatar} from '@mui/material';
import ProfilePicture from "../../../Common/ProfilePicture";
import parse from "html-react-parser";
import './readBlog.css';

const BlogViewer = ({ blog }) => {
  const [content, setContent] = useState("");
  const [styles, setStyles] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const ProfileImage = '';

  useEffect(() => {
    if (blog) setDocumentUrl(blog.document_url);
  }, [blog]);

  useEffect(() => {
    if (!documentUrl) return;
    console.log("Fetching blog content...", documentUrl);
    const fetchHTML = async () => {
      try {
        const response = await fetch(documentUrl);
        if (!response.ok) throw new Error("Failed to load blog content");
        let rawHtml = await response.text();

        // Extract blog directory (e.g., "https://files.linknamali.ke/blogs/{blog_id}/")
        const blogDir = documentUrl.substring(0, documentUrl.lastIndexOf("/") + 1);

        // Fix image sources by making relative paths absolute
        rawHtml = rawHtml.replace(/<img([^>]+)src=["'](?!https?:\/\/)([^"']+)["']/g, `<img$1src="${blogDir}$2"`);

        // Extract <style> content separately
        let extractedStyles = "";
        rawHtml = rawHtml.replace(/<style[\s\S]*?>([\s\S]*?)<\/style>/g, (match, styleContent) => {
          extractedStyles += styleContent;
          return ""; // Remove from the main content
        });

        // Remove outer HTML structure (keeping only inner content)
        rawHtml = rawHtml.replace(/<\/?(html|head|body)[^>]*>/g, "");

        setContent(rawHtml);
        setStyles(extractedStyles);
      } catch (error) {
        console.error("Error fetching blog:", error);
      }
    };

    fetchHTML();
  }, [documentUrl]);

  return (
    <div className="blog-content">
      <h1 style={{color:'var(--text)'}}>{blog.title}</h1>
      <img className="blog-image" src={blog.thumbnail_url}/>
      <div className="mt-4 mb-[30px] flex items-center">
        <>
        {blog.authorProfile ? (
          <ProfilePicture src={ProfileImage} size={50} />
        ) : (
          <Avatar sx={{
            width: 50, 
            height: 50,
          }}/>)}
        </>
        <h3 className="ml-2">By {blog.author}</h3>
      </div>
      {/* Inject styles inside a scoped <style> block */}
      <style>{`.blog-content { ${styles} }`}</style>
      {content ? parse(content) : <p>Loading...</p>}
    </div>
  );
};

export default BlogViewer;
