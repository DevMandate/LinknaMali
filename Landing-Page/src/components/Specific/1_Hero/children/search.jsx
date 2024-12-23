import React from "react";
import { Button, Container, Grid2 } from "@mui/material";
import BasicSelect from '../../../Common/select/BasicSelect'
import CheckMarks from '../../../Common/select/CheckMarks'
import PriceRange from '../../../Common/select/PriceRange'
import Options from '../../../Common/select/Options'

function Search() {
    const handleSearch = () => {
        alert(`Search triggered with query`);
    };
    return(
        <Container
            className=''
            maxWidth=''
            sx={{backgroundColor:'var(--background)', 
                display: 'flex',
                flexDirection:'column',
                alignItems:'center',
                paddingTop: 2,
                marginTop:'30px',
            }}
        >
            <Options/>
            <Grid2 container spacing={1} className='p-5  rounded-md'>
                <BasicSelect />
                <CheckMarks />
                <PriceRange />
                <Button
                    onClick={handleSearch} 
                    variant="contained" 
                    sx={{width:100,
                    backgroundColor:'var(--button-merime)',
                    transition: 'background-color 0.5s ease',
                    "&:hover": {
                        backgroundColor: "#343A85"
                    },
                }}>Search
                </Button>
            </Grid2>
            

        </Container>
    );
}

export default Search;
