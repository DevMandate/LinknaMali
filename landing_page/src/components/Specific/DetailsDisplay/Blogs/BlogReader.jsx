import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import { Container } from "@mui/material";
import ReadBlog from '../../../Admin/Blogs/children/readBlog';
import axios from "axios";
import CircularProgress from "../../../Common/circularProgress";
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'

function BlogReader() {
    const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();
    const [blog, setBlog] = useState(null);

    const { id } = useParams();
    useEffect(() => {
        if(!id ) return;
        setPriorityDisplay('BlogReader');
    }, [id]);
    
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
            const response = await axios.get(`https://api.linknamali.ke/blogs/get-blog/${id}`);
                setBlog(response.data.data || []);
            } catch (err) {
                console.log(err);
            }
        };
        fetchBlogs();
    }, [id]);

    return(
        blog?(
        <Container maxWidth="lg" sx={{display: priorityDisplay === 'BlogReader' ? 'block' : 'none',}}>
            <ReadBlog blog={blog} />
        </Container>
        ):(
            <CircularProgress />
        )
    );
}

export default BlogReader;