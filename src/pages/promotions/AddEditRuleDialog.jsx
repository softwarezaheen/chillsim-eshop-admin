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

const AddEditRuleDialog = ({
  open,
  onClose,
  formData,
  setFormData,
  ruleActions,
  ruleEvents,
  editingRule,
  onSubmit,
}) => {
  const formatLabel = (str) => {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingRule ? 'Edit' : 'Add'} Promotion Rule</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={formData.promotion_rule_action_id}
              onChange={(e) => setFormData({ ...formData, promotion_rule_action_id: e.target.value })}
            >
              {ruleActions.map((action) => (
                <MenuItem key={action.id} value={action.id}>
                  {formatLabel(action.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Event</InputLabel>
            <Select
              value={formData.promotion_rule_event_id}
              onChange={(e) => setFormData({ ...formData, promotion_rule_event_id: e.target.value })}
            >
              {ruleEvents.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {formatLabel(event.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Max Usage"
            value={formData.max_usage}
            onChange={(e) => setFormData({ ...formData, max_usage: parseInt(e.target.value, 10) || 0 })}
          />
          <FormControl fullWidth>
            <InputLabel>Beneficiary</InputLabel>
            <Select
              value={formData.beneficiary}
              onChange={(e) => setFormData({ ...formData, beneficiary: parseInt(e.target.value, 10) })}
            >
              <MenuItem value={0}>REFERRED</MenuItem>
              <MenuItem value={1}>REFERRER</MenuItem>
              <MenuItem value={2}>BOTH</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Rule Description"
            value={formData.rule_description || ''}
            onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
            multiline
            rows={3}
            placeholder="Enter a description for this rule (optional)"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          {editingRule ? 'Update' : 'Add'} Rule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditRuleDialog;