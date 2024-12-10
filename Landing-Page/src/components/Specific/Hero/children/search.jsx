import React from "react";
import { Button, Container, Grid2 } from "@mui/material";
import BasicSelect from '../../../Common/select/BasicSelect'
import CheckMarks from '../../../Common/select/CheckMarks'
import PriceRange from '../../../Common/select/PriceRange'
import Options from '../../../Common/select/Options'

function Search() {
    return(
        <Container
            className=''
            maxWidth='md'
            sx={{backgroundColor:'#CFD3D6', 
                display: 'flex',
                flexDirection:'column',
                alignItems:'center',
                padding: 2,
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
                    variant="contained"
                    sx={{width:100,
                    backgroundColor:'#22275E',
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
