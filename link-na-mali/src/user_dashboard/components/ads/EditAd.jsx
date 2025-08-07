import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

// Base API URL
const API_BASE = 'https://api.linknamali.ke';
export default function EditAd({ open, onClose, ad, onUpdated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    budget: '',
    payment_method: 'mpesa',
    mpesa_number: ''
  });
  const [existingUrls, setExistingUrls] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ad) {
      setForm({
        title: ad.title || '',
        description: ad.description || '',
        start_date: ad.start_date || '',
        end_date: ad.end_date || '',
        budget: ad.budget?.toString() || '',
        payment_method: ad.payment_method || 'mpesa',
        mpesa_number: ad.mpesa_number || ''
      });
      setExistingUrls(ad.media_urls || []);
      setNewFiles([]);
      setError(null);
    }
  }, [ad]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = e => {
    setNewFiles(Array.from(e.target.files));
  };

  const performUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val);
        }
      });
      existingUrls.forEach(url => formData.append('media_urls', url));
      newFiles.forEach(file => formData.append('media_urls', file));

      const res = await fetch(`${API_BASE}/ads/${ad.ad_id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      window.alert('Ad updated successfully');
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
      window.alert(`Update failed: ${err.message}`);
      onUpdated(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Ad</DialogTitle>
      <DialogContent>
        <form id="edit-ad-form" encType="multipart/form-data">
          <TextField fullWidth margin="dense" label="Title" name="title" value={form.title} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Description" name="description" multiline rows={3} value={form.description} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Start Date" name="start_date" type="date" InputLabelProps={{ shrink: true }} value={form.start_date} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="End Date" name="end_date" type="date" InputLabelProps={{ shrink: true }} value={form.end_date} onChange={handleChange} />
          <TextField fullWidth margin="dense" label="Budget" name="budget" type="number" value={form.budget} onChange={handleChange} />
          <FormControl fullWidth margin="dense">
            <InputLabel id="payment-method-label">Payment Method</InputLabel>
            <Select labelId="payment-method-label" label="Payment Method" name="payment_method" value={form.payment_method} onChange={handleChange}>
              <MenuItem value="mpesa">Mpesa</MenuItem>
              <MenuItem value="card">Card</MenuItem>
            </Select>
          </FormControl>
          {form.payment_method === 'mpesa' && (
            <TextField fullWidth margin="dense" label="Mpesa Number" name="mpesa_number" value={form.mpesa_number} onChange={handleChange} />
          )}
          <div style={{ marginTop: 16 }}>
            <label>Existing Media:</label>
            <ul>
              {existingUrls.map((url, idx) => (<li key={idx}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>))}
            </ul>
          </div>
          <div style={{ marginTop: 16 }}>
            <label htmlFor="media-upload">Upload New Media:</label>
            <input id="media-upload" type="file" name="media_urls" multiple onChange={handleFileChange} />
          </div>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={performUpdate} disabled={loading} variant="contained">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

EditAd.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func.isRequired,
  ad: PropTypes.shape({
    ad_id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    budget: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    payment_method: PropTypes.string,
    mpesa_number: PropTypes.string,
    media_urls: PropTypes.arrayOf(PropTypes.string)
  })
};
