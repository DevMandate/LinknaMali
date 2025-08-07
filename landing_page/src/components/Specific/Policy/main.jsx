import React, {useState, useEffect} from 'react';
import { useLocation } from "react-router-dom";
import {Container, Button, Menu, MenuItem, Divider } from '@mui/material';
import {usePriorityDisplay} from '../../../context/PriorityDisplay';
import './policy.css'
const Services = () => {
    const location = useLocation();
    const {priorityDisplay} = usePriorityDisplay(); 
    const extra = location.state 
        ? Object.values(location.state)[0]
        : null;
    console.log('received',extra)
    const pdfLinks = {
        'cookie': "https://files.linknamali.ke/assets/Company/Linknamali_Cookie_Policy.pdf",
        'privacy': "https://files.linknamali.ke/assets/Company/Linknamali_Privacy_Policy.pdf",
        'terms': "https://files.linknamali.ke/assets/Company/Linknamali_Terms_of_Use.pdf",
    };

    const policies = [
        { key: "terms", title: "Terms of Service", buttonLabel: "View Terms and Conditions" },
        { key: "privacy", title: "Privacy Policy", buttonLabel: "View Privacy Policy" },
        { key: "cookie", title: "Cookie Policy", buttonLabel: "View Cookie Policy" },
    ];
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentPolicy, setCurrentPolicy] = useState('');
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handlePolicySelect = (policyKey) => {
        setCurrentPolicy(policyKey);
        handleMenuClose();
    };
    useEffect(() => {
        if (extra) setCurrentPolicy(extra);
    }, [extra]);
    const pdfSrc = pdfLinks[currentPolicy];

    return (
        <Container maxWidth='false'
            id='policies'
            className='Policy'
            sx={{
                position: 'relative',
                display: priorityDisplay === 'policies' ? 'block' : 'none',
            }}>
            <Button
                variant="contained"
                onClick={handleMenuOpen}
                className='policy-button'
                style={{position: 'absolute'}}
            >
            Read Other Policies
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {policies.map((policy, index) => (
                <React.Fragment key={policy.key}>
                    <MenuItem onClick={() => handlePolicySelect(policy.key)}>{policy.title}</MenuItem>
                    {index < policies.length - 1 && <Divider />}
                </React.Fragment>
                ))}
            </Menu>
            <iframe src={pdfSrc}/>
        </Container>
    );
};

export default Services;
