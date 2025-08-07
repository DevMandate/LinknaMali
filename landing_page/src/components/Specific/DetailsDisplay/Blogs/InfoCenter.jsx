import React, {useEffect, useState} from "react";
import { useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import BasicButton from '../../../Common/MUI_Button_Custom/basic'
import {usePriorityDisplay} from '../../../../context/PriorityDisplay'
import BlogGrid from "./blogGrid";
import axios from "axios";

function InfoCenter() {
    const location = useLocation();
    const {priorityDisplay,setPriorityDisplay} = usePriorityDisplay();

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (decodeURIComponent(location.pathname) === "/blogs/property info and opportunities") {
            setPriorityDisplay("InfoCenter");
        }
    }, [location.pathname]);
    

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
            const response = await axios.get("https://api.linknamali.ke/blogs/get-all/class-1");
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
    <Container maxWidth="lg" sx={{display: priorityDisplay === 'InfoCenter' ? 'block' : 'none'}}>
        <div className="blog-invite info-center">
            <h3>Have Real Estate News or Insights?</h3>
            <p>Stay ahead in the property market! Share exciting real estate updates, trends, or investment opportunities at the Coast.</p>
            <BasicButton sx={{mt:2}} onClick={() => window.location.href = "mailto:engage@merimedevelopment.co.ke"} text='📩 Share Your Insights'/>
        </div>
        <BlogGrid blogs={blogs} loading={loading} error={error}/>
    </Container>
    );
}

export default InfoCenter;