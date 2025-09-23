import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from "@mui/material";
import { savePartner } from "../../core/apis/partnersAPI";

export default function PartnerForm({ open, onClose, partner }) {
  const [form, setForm] = useState({
    name: "",
    code_prefix: "",
    description: "",
    contactPerson: "",
    email: "",
    phone: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name || "",
        code_prefix: partner.code_prefix || "",
        description: partner.description || "",
        contactPerson: partner.contact_info?.contactPerson || "",
        email: partner.contact_info?.email || "",
        phone: partner.contact_info?.phone || "",
        is_active: partner.is_active !== undefined ? partner.is_active : true,
      });
    } else {
      setForm({
        name: "",
        code_prefix: "",
        description: "",
        contactPerson: "",
        email: "",
        phone: "",
      });
    }
  }, [partner, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "is_active" ? value === "true" : value
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code_prefix.match(/^[A-Za-z]{2}$/)) {
      alert("Name and 2-letter Prefix are required.");
      return;
    }
    setSaving(true);
    const result = await savePartner(form, partner);
    setSaving(false);
    if (!result.error) {
      onClose(true);
    } else {
      alert(result.error.message);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{partner ? "Edit Partner" : "Add Partner"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Prefix (2 letters)" name="code_prefix" value={form.code_prefix} onChange={handleChange} fullWidth required inputProps={{ maxLength: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Contact Person" name="contactPerson" value={form.contactPerson} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth />
          </Grid>
          {partner && (
            <Grid item xs={12} sm={4}>
              <label style={{ display: 'block', marginBottom: 4 }}>Is Active</label>
              <select name="is_active" value={form.is_active ? "true" : "false"} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: 4 }}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </DialogActions>
    </Dialog>
  );
}
