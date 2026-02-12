import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import CustomDatePicker from '../../Components/CustomDatePicker';

const BulkEditValidityModal = ({ open, onClose, onSubmit, selectedCount }) => {
  const [validFrom, setValidFrom] = useState(null);
  const [validTo, setValidTo] = useState(null);

  const handleSubmit = () => {
    if (!validFrom && !validTo) {
      alert('Please select at least one date to update');
      return;
    }
    
    if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
      alert('Valid From must be before or equal to Valid To');
      return;
    }
    
    onSubmit(validFrom, validTo);
    handleClose();
  };

  const handleClose = () => {
    setValidFrom(null);
    setValidTo(null);
    onClose();
  };

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
        Bulk Edit Validity Dates ({selectedCount} promotion{selectedCount !== 1 ? 's' : ''})
      </DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <CustomDatePicker
            label="Valid From (Inclusive)"
            value={validFrom}
            onChange={setValidFrom}
          />
          <CustomDatePicker
            label="Valid To (Inclusive)"
            value={validTo}
            onChange={setValidTo}
          />
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
            Note: Leave a field empty to keep its current value. Both dates are inclusive - 
            promotions will be valid ON the selected dates.
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Update Validity
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkEditValidityModal;
