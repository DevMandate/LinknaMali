import React from "react";
import { Button, Container, Grid2 } from "@mui/material";
import BasicSelect from './select/BasicSelect'
import CheckMarks from './select/CheckMarks'
import PriceRange from './select/PriceRange'
import Options from './select/Options'

function Search() {
    const handleSearch = () => {
        alert(`Search triggered with query`);
    };
    return(
        <Container
            id='search'
            className=''
            maxWidth='false'
            sx={{backgroundColor:'var(--background)', 
                display: 'flex',
                flexDirection:'column',
                alignItems:'center',
                paddingTop: 3,
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
