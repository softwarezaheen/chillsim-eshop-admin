import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import CustomDatePicker from '../CustomDatePicker';
import { getPromotionRules } from '../../core/apis/promotionsAPI';

const BulkGeneratePromoModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rules, setRules] = useState([]);

  const [formData, setFormData] = useState({
    rule_id: '',
    count: 100,
    amount: 10,
    promo_name: '',
    code_length: 8,
    valid_from: new Date().toISOString(),
    valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
  });

  useEffect(() => {
    if (open) {
      loadPromotionRules();
      // Reset form when modal opens
      setError(null);
      setSuccess(null);
      setFormData({
        rule_id: '',
        count: 100,
        amount: 10,
        promo_name: '',
        code_length: 8,
        valid_from: new Date().toISOString(),
        valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      });
    }
  }, [open]);

  const loadPromotionRules = async () => {
    setLoadingRules(true);
    try {
      const { data, error } = await getPromotionRules();
      if (error) {
        setError(`Failed to load promotion rules: ${error.message}`);
      } else {
        setRules(data || []);
      }
    } catch (err) {
      setError(`Failed to load promotion rules: ${err.message}`);
    } finally {
      setLoadingRules(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.rule_id) {
      setError('Please select a promotion rule');
      return false;
    }
    if (!formData.promo_name || formData.promo_name.trim() === '') {
      setError('Please enter a promotion name');
      return false;
    }
    if (!formData.count || formData.count < 1 || formData.count > 10000) {
      setError('Count must be between 1 and 10,000');
      return false;
    }
    if (!formData.code_length || formData.code_length < 6 || formData.code_length > 20) {
      setError('Code length must be between 6 and 20');
      return false;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!formData.valid_from || !formData.valid_to) {
      setError('Please select valid from and valid to dates');
      return false;
    }
    if (new Date(formData.valid_from) >= new Date(formData.valid_to)) {
      setError('Valid from date must be before valid to date');
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Adjust dates: valid_from to start of day, valid_to to end of day
      const validFrom = new Date(formData.valid_from);
      validFrom.setHours(0, 0, 0, 0);
      
      const validTo = new Date(formData.valid_to);
      validTo.setHours(23, 59, 59, 999);

      const requestData = {
        ...formData,
        valid_from: validFrom.toISOString(),
        valid_to: validTo.toISOString(),
      };

      const { bulkGeneratePromoCodes } = await import('../../core/apis/promotionsAPI');
      const result = await bulkGeneratePromoCodes(requestData);

      if (result.data) {
        setSuccess(`Successfully generated ${result.data.generated_count} promo codes!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Failed to generate promo codes');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate promo codes');
    } finally {
      setLoading(false);
    }
  };

  const selectedRule = rules.find((r) => r.id === formData.rule_id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          🎟️ Bulk Generate Promo Codes
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <FormControl fullWidth required>
            <InputLabel>Promotion Rule</InputLabel>
            <Select
              value={formData.rule_id}
              onChange={(e) => handleChange('rule_id', e.target.value)}
              disabled={loadingRules}
              label="Promotion Rule"
            >
              {loadingRules ? (
                <MenuItem disabled>
                  <CircularProgress size={20} /> Loading rules...
                </MenuItem>
              ) : rules.length === 0 ? (
                <MenuItem disabled>No promotion rules found</MenuItem>
              ) : (
                rules.map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.rule_description || 
                     `${rule.promotion_rule_action?.name || ''} - ${rule.promotion_rule_event?.name || ''}`}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {selectedRule && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Rule Details:</strong>
                <br />
                Action: {selectedRule.promotion_rule_action?.name || 'N/A'}
                <br />
                Event: {selectedRule.promotion_rule_event?.name || 'N/A'}
                <br />
                Max Usage: {selectedRule.max_usage || 'Unlimited'}
                <br />
                <br />
                <strong>Note:</strong> The rule defines the TYPE of promotion. You specify the actual discount/cashback value below.
              </Typography>
            </Alert>
          )}

          <Divider />

          <TextField
            label="Promotion Name"
            value={formData.promo_name}
            onChange={(e) => handleChange('promo_name', e.target.value)}
            fullWidth
            required
            placeholder="e.g., Black Friday 2025, Partner Campaign Q4"
            helperText="All generated codes will share this name for easy identification"
          />

          <TextField
            label={selectedRule?.promotion_rule_action?.name?.includes('PERCENTAGE') ? 'Discount/Cashback Percentage' : 'Discount/Cashback Amount'}
            type="number"
            value={formData.amount}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            fullWidth
            required
            helperText={
              selectedRule?.promotion_rule_action?.name?.includes('PERCENTAGE')
                ? 'Enter percentage (e.g., 10 for 10% off)'
                : selectedRule?.promotion_rule_action?.name?.includes('AMOUNT')
                ? 'Enter fixed amount (e.g., 5.00 for €5.00 off)'
                : 'Enter the discount or cashback value'
            }
            inputProps={{ min: 0, step: selectedRule?.promotion_rule_action?.name?.includes('PERCENTAGE') ? 1 : 0.01 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Number of Codes"
              type="number"
              value={formData.count}
              onChange={(e) => handleChange('count', parseInt(e.target.value) || 0)}
              fullWidth
              required
              helperText="1 - 10,000 codes"
              inputProps={{ min: 1, max: 10000 }}
            />
            <TextField
              label="Code Length"
              type="number"
              value={formData.code_length}
              onChange={(e) => handleChange('code_length', parseInt(e.target.value) || 8)}
              fullWidth
              required
              helperText="6 - 20 characters (8 recommended)"
              inputProps={{ min: 6, max: 20 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <CustomDatePicker
              label="Valid From"
              value={formData.valid_from}
              onChange={(date) => handleChange('valid_from', date)}
              required
            />
            <CustomDatePicker
              label="Valid To"
              value={formData.valid_to}
              onChange={(date) => handleChange('valid_to', date)}
              required
            />
          </Box>

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Important:</strong>
              <br />
              • Codes are generated with alphanumeric characters (excluding ambiguous 0, O, I, 1)
              <br />
              • Each code is checked for uniqueness against existing promo codes and referral codes
              <br />
              • 8-character codes provide ~218 trillion combinations (secure for bulk distribution)
              <br />• Generated codes cannot be edited - please verify settings before generation
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          color="primary"
          disabled={loading || loadingRules}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Generating...' : `Generate ${formData.count} Codes`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkGeneratePromoModal;
