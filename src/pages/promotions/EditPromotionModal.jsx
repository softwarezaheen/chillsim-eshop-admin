import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Switch, Box } from '@mui/material';
import CustomDatePicker from '../../Components/CustomDatePicker';

const EditPromotionModal = ({ open, onClose, onSubmit, promotion }) => {
  const [formData, setFormData] = useState({
    name: '',
    valid_from: null,
    valid_to: null,
    is_active: true,
  });

  useEffect(() => {
    if (promotion && open) {
      setFormData({
        name: promotion.name || '',
        valid_from: promotion.valid_from || null,
        valid_to: promotion.valid_to || null,
        is_active: promotion.is_active !== undefined ? promotion.is_active : true,
      });
    }
  }, [promotion, open]);

  const handleSubmit = () => {
    if (formData.valid_from && formData.valid_to && new Date(formData.valid_from) > new Date(formData.valid_to)) {
      alert('Valid From must be before or equal to Valid To');
      return;
    }
    
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      valid_from: null,
      valid_to: null,
      is_active: true,
    });
    onClose();
  };

  if (!promotion) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { overflow: 'visible' }
      }}
    >
      <DialogTitle>
        Edit Promotion: {promotion.code}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Promotion Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            helperText="NOTE: This is the promotion NAME, not the CODE. The code cannot be changed."
          />
          <CustomDatePicker
            label="Valid From (Inclusive)"
            value={formData.valid_from}
            onChange={(date) => setFormData({ ...formData, valid_from: date })}
          />
          <CustomDatePicker
            label="Valid To (Inclusive)"
            value={formData.valid_to}
            onChange={(date) => setFormData({ ...formData, valid_to: date })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label={formData.is_active ? "Active" : "Inactive"}
          />
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            Both dates are inclusive - promotions will be valid ON the selected dates.
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditPromotionModal;
