import React from 'react';
import { Grid2 as Grid, Typography, Button, Card, CardContent, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePriorityDisplay } from '../../../context/PriorityDisplay';
import {scrollIntoView} from '../../../utils/scrollIntoView'
import BasicButton from '../../Common/MUI_Button_Custom/basic'
import {LinknaMali} from '../../../assets/images'
import './aboutus.css'
const AboutUs = () => {
    const navigate = useNavigate();
    const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();
    function handleSignUp(){
        navigate('/signup');
        setPriorityDisplay('signup');
        scrollIntoView('signup')
    }
    return (
        <div 
        id='about us' 
        className='AboutUs'>
        {/* Header Section */}

        <div className='flex items-center justify-center'><BasicButton text="Start Your Search" animation onClick={handleSignUp} sx={{ mt: 5 }} /></div>
            
        {/* Our Story */}
        <Box sx={{ mt: 6, p: 4, borderRadius: '8px' }}>
            <Typography variant="h4" gutterBottom>
                What is Our Story?
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="var(--merime-theme)">
                Making Coastal Real Estate Accessible, Visible & Transparent
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Linknamali was born out of a real problem—the struggle people face when searching for property along Kenya’s coast. Many had to travel long distances, visit multiple locations, and negotiate with unreliable agents, only to remain uncertain about their choices. For those already within the Coast, finding a home meant spending valuable time, money, and effort.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Recognizing this frustration, Merime Development envisioned a better way—a trusted online platform where property seekers could explore listings, receive expert guidance, and connect directly with verified sellers, landlords, and legal professionals.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Linknamali serves as the bridge between real estate opportunities and those seeking them. By leveraging technology, local expertise, and a commitment to transparency, we make property search seamless and trustworthy. 
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
                Our goal? To revolutionize real estate in Coastal Kenya—ensuring that homebuyers, investors, and renters can make informed decisions with confidence, convenience, and ease.
            </Typography>
        </Box>

            {/* Why Linknamali Section */}
            <div className='AboutUs-parent flex'>

            <div className='AboutUs-child flex items-center'><div><img width='100%' height='100%' style={{objectFit:'cover'}} src={LinknaMali}/></div></div>
            <Container maxWidth='md' sx={{ mt: 2, padding: 2 }}>
                <Typography variant="h4">
                    Why Linknamali?
                </Typography>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item='true' xs={12} md={6}>
                        <Card elevation={3} className='AboutUs-why-card'>
                            <CardContent>
                                <Typography variant="h6" component="h3">
                                    Wide Selection of Properties
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    Browse a diverse range of properties tailored to your needs—whether you’re looking to rent, buy, or invest.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item='true' xs={12} md={6}>
                        <Card elevation={3} className='AboutUs-why-card'>
                            <CardContent>
                                <Typography variant="h6" component="h3">
                                    Smart Recommendations
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    Powered by advanced AI, our platform matches you with properties that align with your preferences and budget.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item='true' xs={12} md={6}>
                        <Card elevation={3} className='AboutUs-why-card'>
                            <CardContent>
                                <Typography variant="h6" component="h3">
                                    Expert Guidance
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    Connect with trusted professionals, including lawyers, property valuers, and agents, to make informed decisions every step of the way.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item='true' xs={12} md={6}>
                        <Card elevation={3} className='AboutUs-why-card'>
                            <CardContent>
                                <Typography variant="h6" component="h3">
                                    Transparency and Trust
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    Rest easy knowing every listing is verified for accuracy and legitimacy.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            </div>



            {/* Our Audience Section */}
            <Box sx={{ mt: 6 }} className='p-2 flex flex-col items-center justify-center'>
            <Typography variant="h4">
                Our Audience
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item='true' xs={12} md={6} className='AboutUs-grid'>
                <Card elevation={3} className='AboutUs-card'>
                    <CardContent>
                    <Typography variant="h6" component="h3">
                        Homebuyers Relocating to the Coast
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Find the perfect home to settle in along the scenic Kenyan coast with ease.
                    </Typography>
                    </CardContent>
                </Card>
                </Grid>
                <Grid item='true' xs={12} md={6} className='AboutUs-grid'>
                <Card elevation={3} className='AboutUs-card'>
                    <CardContent>
                    <Typography variant="h6" component="h3">
                        Diaspora Investors Seeking Seamless Processes
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Invest in real estate along the coast with confidence and full transparency.
                    </Typography>
                    </CardContent>
                </Card>
                </Grid>
                <Grid item='true' xs={12} md={6} className='AboutUs-grid'>
                <Card elevation={3} className='AboutUs-card'>
                    <CardContent>
                    <Typography variant="h6" component="h3">
                        Vacationers Looking for Short-Term Rentals
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Find your perfect vacation home with ease and explore the Kenyan coast.
                    </Typography>
                    </CardContent>
                </Card>
                </Grid>
                <Grid item='true' xs={12} md={6} className='AboutUs-grid'>
                <Card elevation={3} className='AboutUs-card'>
                    <CardContent>
                    <Typography variant="h6" component="h3">
                        Real Estate Investors Seeking Profitable Opportunities
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Discover profitable real estate opportunities for investment on the coast.
                    </Typography>
                    </CardContent>
                </Card>
                </Grid>
            </Grid>
            </Box>
                        {/* How It Works Section */}
            <Container sx={{ mt: 6 }}>
                <Typography variant="h4">
                    How It Works
                </Typography>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                    <Grid item='true' xs={12} md={4}>
                        <Typography variant="h6">1. Search Properties</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Use our intuitive search tools to explore listings.
                        </Typography>
                    </Grid>
                    <Grid item='true' xs={12} md={4}>
                        <Typography variant="h6">2. Get Matched</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Receive AI-driven recommendations tailored to your preferences.
                        </Typography>
                    </Grid>
                    <Grid item='true' xs={12} md={4}>
                        <Typography variant="h6">3. Connect and Close</Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            Work with professionals to finalize your purchase or rental with confidence.
                        </Typography>
                    </Grid>
                </Grid>
            </Container>
            {/* Call to Action Section */}
            <Container sx={{ mt: 6 }}>
            <Typography variant="h4" sx={{ textAlign: 'left' }}>
                Let Linknamali Guide You Home
            </Typography>
            <Typography variant="h6" sx={{ mt: 2, textAlign: 'left' }}>
                Join us in revolutionizing the way properties are found, bought, and rented along Kenya’s coast. Whether you’re an investor, a buyer, or just curious, Linknamali offers the convenience and expertise you need.
            </Typography>
            <Button sx={{margin:'20px 0px 50px 0px', backgroundColor:'var(--merime-theme)'}} variant="contained" onClick={() => handleSignUp()}>
                Start Your Search Today
            </Button>
            </Container>

        </div>
    );
};

export default AboutUs;
