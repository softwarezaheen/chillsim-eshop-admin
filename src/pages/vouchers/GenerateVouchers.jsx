import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, Grid } from "@mui/material";
import supabase from "../../core/apis/supabase";

function randomCode(prefix = "", len = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  prefix = typeof prefix === "string" ? prefix.toUpperCase().slice(0, 2) : "";
  let code = prefix;
  if (code.length > len) code = code.slice(0, len); // Defensive: never longer than len
  while (code.length < len) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function GenerateVouchers({ open, onClose, onGenerated }) {
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState({
    partner_id: "",
    amount: "",
    howMany: 1,
    expired_at: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPartners() {
      const { data } = await supabase.from("partners").select("id, name, code_prefix, is_active").order("name");
      setPartners((data || []).filter(p => p.is_active));
    }
    fetchPartners();
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!form.amount || !form.howMany || !form.expired_at) {
      alert("Please fill all fields.");
      return;
    }
    setSaving(true);
    let prefix = "";
    if (form.partner_id) {
      const partner = partners.find(p => p.id === form.partner_id);
      prefix = partner?.code_prefix || "";
    }
    const vouchers = [];
    for (let i = 0; i < Number(form.howMany); i++) {
      vouchers.push({
        code: randomCode(prefix, 12),
        amount: Number(form.amount),
        expired_at: form.expired_at,
        partner_id: form.partner_id || null,
        is_active: true,
        is_used: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    const result = await supabase.from("voucher").insert(vouchers);
    setSaving(false);
    if (!result.error) {
      if (onGenerated) onGenerated();
      onClose();
    } else {
      alert(result.error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Vouchers</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Partner</InputLabel>
              <Select
                name="partner_id"
                value={form.partner_id}
                label="Partner"
                onChange={handleChange}
              >
                <MenuItem value="">NONE</MenuItem>
                {partners.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Voucher Amount" name="amount" value={form.amount} onChange={handleChange} type="number" fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="How Many" name="howMany" value={form.howMany} onChange={handleChange} type="number" fullWidth required />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Expiration Date" name="expired_at" value={form.expired_at} onChange={handleChange} type="datetime-local" fullWidth required InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleGenerate} variant="contained" color="primary" disabled={saving}>{saving ? "Generating..." : "Generate"}</Button>
      </DialogActions>
    </Dialog>
  );
}
