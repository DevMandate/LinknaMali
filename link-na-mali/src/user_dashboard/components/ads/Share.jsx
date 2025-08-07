import React from "react";
import { Box, Typography, IconButton, Button, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";

/**
 * Share renders share options for a fetched ad (via ManageAds).
 * Props:
 * - details: ad object containing ad_id, title, description, media_urls.
 */
const Share = ({ details }) => {
  const shareUrl = `https://linknamali.ke/ads/${encodeURIComponent(details.ad_id)}`;
  const shareText = encodeURIComponent(
    `${details.title}\n\n${details.description}\n\n${shareUrl}`
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const handleWhatsappShare = () => {
    window.open(
      `https://wa.me/?text=${shareText}`,
      "_blank"
    );
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  return (
    <Box>
      {details.media_urls?.[0] && (
        <Box
          component="img"
          src={details.media_urls[0]}
          alt={details.title}
          sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
        />
      )}
      <Typography variant="h6" gutterBottom>
        {details.title}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {details.description}
      </Typography>
      <TextField
        label="Shareable Link"
        value={shareUrl}
        fullWidth
        variant="outlined"
        InputProps={{ readOnly: true }}
        onClick={e => e.target.select()}
        sx={{ my: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <IconButton onClick={handleWhatsappShare} sx={{ color: '#25D366' }}>
          <WhatsAppIcon fontSize="large" />
        </IconButton>
        <IconButton onClick={handleFacebookShare} sx={{ color: '#29327E' }}>
          <FacebookIcon fontSize="large" />
        </IconButton>
        <Button
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={copyToClipboard}
        >
          Copy Link
        </Button>
      </Box>
    </Box>
  );
};

export default Share;
