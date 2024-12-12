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
            sx={{backgroundColor:'var(--color-merime)', 
                display: 'flex',
                flexDirection:'column',
                alignItems:'center',
                paddingTop: 2,
                marginTop:'80px',
                maxWidth:'710px',
                borderTopLeftRadius: '5px',
                borderTopRightRadius: '5px',
                '@media (max-width: 900px)': {
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                },
            }}
        >
            <Options/>
            <Grid2 container spacing={1} className='p-5 bg-[white] rounded-md'>
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
