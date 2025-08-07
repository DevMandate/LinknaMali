import { Button } from "@mui/material";

const BasicButton = ({ text, onClick, sx ,animation=false }) => {
    return (
        <Button 
            className={`${animation ? 'bounce' : ''}`}
            onClick={onClick} 
            autoFocus
            sx={{
                minWidth:'100px', 
                color:'var(--color-white)', 
                backgroundColor: 'var(--merime-theme)',
                 ...sx 
        }}>{text || "Continue"}
        </Button>
    );
};
export default BasicButton;
