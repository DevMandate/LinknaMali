import React, {useEffect, useState} from "react";
import { useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import BlogGrid from "./blogGrid";
import BasicButton from '../../../Common/MUI_Button_Custom/basic'
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import axios from "axios";
import './blog.css'

function StoryZaMitaa() {
    const location = useLocation();
    const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (decodeURIComponent(location.pathname) === "/blogs/story za mitaa") {
            setPriorityDisplay("StoryZaMitaa");
        }
    }, [location.pathname]);
    

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
            const response = await axios.get("https://api.linknamali.ke/blogs/get-all/class-0");
            setBlogs(response.data.data || []);
            } catch (err) {
            setError("No Blogs Available");
            } finally {
            setLoading(false);
            }
        };
        fetchBlogs();
    }, []);
    return(
    <Container maxWidth="lg" sx={{display: priorityDisplay === 'StoryZaMitaa' ? 'block' : 'none'}}>
        <div className="blog-invite story-za-mitaa">
            <h3>Got a Story About Your Neighborhood?</h3>
            <p>We’d love to hear it! Share your experiences, hidden gems, and community stories with us.</p>
            <BasicButton sx={{mt:2}} onClick={() => window.location.href = "mailto:engage@merimedevelopment.co.ke"} text='✍️ Write to Us'/>
        </div>
        <BlogGrid blogs={blogs} loading={loading} error={error}/>
    </Container>
    );
}

export default StoryZaMitaa;
