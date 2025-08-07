import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import {useSearchEngine} from '../../../../context/SearchEngine'
import { useLogin } from '../../../../context/IsLoggedIn';

export default function DeleteAccount() {

  const [error, setError] = useState('');
  const [confirmationText, setConfirmationText] = useState("");
  const {searchEngine,setSearchEngine} = useSearchEngine();
  const {userData,setRequestLogout} = useLogin();
  
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setConfirmationText("");
  };
  const handleDelete = async () => {
    try {
        setSearchEngine(true); 
        const response = await fetch(`https://api.linknamali.ke/auth/deleteuser/${userData.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        let result;
        try {
            result = await response.json();
        } catch (error) {
            result = { response: "Please check internet connection or try again later." };
        }
        if (response.ok) {
            setRequestLogout(true);         
        } else {
            setError(result.response);
        }
    } catch (error) {
        setError('Server Error. Please try again later.');
    } finally {
        setSearchEngine(false);
    }
  };

  return (
    <>
      <Button color="error" variant="contained" onClick={handleOpen}>
        Delete Account
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
            {error && <div className="mb-4 text-red-500">{error}</div>}
            <p>
              Deleting your account means losing all your data. This action cannot be undone.
            </p>
            <p>Please type <strong>'I understand'</strong> to proceed.</p>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="I understand"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              margin="dense"
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} sx={{color:'var(--merime-theme)'}}>
            Cancel
          </Button>
          <Button 
            color="error" 
            variant="contained" 
            disabled={confirmationText !== "I understand"}
            onClick={handleDelete}
          >
            {searchEngine? <CircularProgress size={20}/>:'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
