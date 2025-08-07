import React from "react";
import { Container} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
function Progress() {
    return(
        <Container 
            sx={{minHeight:'200px',display:'flex', justifyContent:'center', alignItems:'center'}}>
            <CircularProgress size={50} />
        </Container>
    );
}

export default Progress;
