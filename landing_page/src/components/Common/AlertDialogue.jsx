import React from "react";
import { Dialog, DialogTitle, DialogActions,Button } from "@mui/material";
import BasicButton from './MUI_Button_Custom/basic';
import {useTheme} from '../../context/Theme'
const AlertDialog = ({requestExit=false}) => {
    const { 
        alertOpen,
        message,
        handleClose,
        handleExit,
    } = useTheme();
  return (
    <Dialog 
      open={alertOpen} 
      onClose={(event) => handleExit(event)}
      sx={{ 
        "& .MuiDialog-paper": { padding: 2 }
      }}
    >
      <DialogTitle>{message}</DialogTitle>
      <DialogActions>
        {requestExit &&(<Button onClick={(event)=> handleExit(event)} 
          sx={{marginRight:2}}>Close</Button>)}
        <BasicButton onClick={(event) => handleClose(event)}/>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
