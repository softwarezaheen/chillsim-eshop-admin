import React from 'react';
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
  MenuItem,
} from '@mui/material';
import CustomDatePicker from '../../Components/CustomDatePicker';

const AddPromotionDialog = ({
  open,
  onClose,
  formData,
  setFormData,
  promotionRules,
  onSubmit,
}) => {
  const getBeneficiaryLabel = (beneficiary) => {
    switch (beneficiary) {
      case 0: return 'REFERRED';
      case 1: return 'REFERRER';
      case 2: return 'BOTH';
      default: return beneficiary;
    }
  };

  const formatLabel = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Promotion</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
          <FormControl fullWidth>
            <InputLabel>Rule Template</InputLabel>
            <Select
              value={formData.rule_id}
              onChange={(e) => setFormData({ ...formData, rule_id: e.target.value })}
            >
              {promotionRules.map((rule) => (
                <MenuItem key={rule.id} value={rule.id}>
                  {rule.rule_description || 'No description'} - {formatLabel(rule.promotion_rule_action?.name)} on {formatLabel(rule.promotion_rule_event?.name)} (Max: {rule.max_usage}, Beneficiary: {getBeneficiaryLabel(rule.beneficiary)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Code"
            value={formData.code}
            placeholder='Ex: SUMMER2024'
            onChange={(e) => {
              // Convert to uppercase and only allow letters, digits, and hyphens (no spaces)
              const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
              setFormData({ ...formData, code: sanitizedValue });
            }}
          />
          <TextField
            fullWidth
            label="Bundle Code"
            placeholder='Leave empty for all bundles or specify a bundle code'
            value={formData.bundle_code}
            onChange={(e) => setFormData({ ...formData, bundle_code: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="PROMOTION">PROMOTION</MenuItem>
              <MenuItem value="REFERRAL">REFERRAL</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Promotion Name"
            placeholder='Descriptive name for the promotion'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            type="number"
            label="Amount"
            placeholder='(e.g., 10 for 10EUR off or 10 for 10% off)'
            value={formData.amount || ''}
            onChange={(e) => {
              const inputValue = e.target.value;
              if (inputValue === '') {
                setFormData({ ...formData, amount: '' });
              } else {
                const value = parseInt(inputValue, 10);
                if (!isNaN(value) && value > 0) {
                  setFormData({ ...formData, amount: value });
                }
              }
            }}
            inputProps={{
              min: 1,
              step: 1,
            }}
          />
          {/* Hidden callback fields - kept for future use */}
          {/*
          <TextField
            fullWidth
            label="Callback URL"
            value={formData.callback_url}
            onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
          />
          <TextField
            fullWidth
            label="Callback Headers"
            multiline
            rows={3}
            value={formData.callback_headers}
            onChange={(e) => setFormData({ ...formData, callback_headers: e.target.value })}
          />
          */}
          <CustomDatePicker
            label="Valid From"
            value={formData.valid_from}
            onChange={(date) => setFormData({ ...formData, valid_from: date })}
          />
          <CustomDatePicker
            label="Valid To"
            value={formData.valid_to}
            onChange={(date) => setFormData({ ...formData, valid_to: date })}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          Add Promotion
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPromotionDialog;