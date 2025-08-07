import { Button } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

const StandardButton = ({ text,fullWidth = true,isloading,onClick,disabled, sx }) => {
    return (
        <Button 
            type="submit"
            fullWidth={fullWidth}
            variant="contained"
            disabled={isloading || disabled}
            onClick={onClick} 
            sx={{
                minWidth:'100px', 
                color:'var(--color-white)', 
                backgroundColor: 'var(--merime-theme)',
                 ...sx 
        }}>{isloading? <CircularProgress size={20}/> :text}
        </Button>
    );
};
export default StandardButton;
