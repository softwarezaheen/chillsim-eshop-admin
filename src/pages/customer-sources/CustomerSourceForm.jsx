import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  createCustomerSource,
  updateCustomerSource,
} from "../../core/apis/attributionAPI";

const MATCH_TYPES = [
  { value: "utm_source", label: "UTM Source" },
  { value: "promo_code", label: "Promo Code (exact)" },
  { value: "promo_code_prefix", label: "Promo Code (prefix)" },
  { value: "affiliate", label: "Affiliate Network" },
  { value: "partner_id", label: "Partner ID" },
  { value: "referral", label: "Referral" },
];

export default function CustomerSourceForm({
  open,
  onClose,
  source,
  parentId,
  allSources,
}) {
  const isEdit = !!source;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: parentId || null,
    is_active: true,
    sort_order: 0,
    detection_rules: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (source) {
      setForm({
        name: source.name || "",
        slug: source.slug || "",
        description: source.description || "",
        parent_id: source.parent_id || null,
        is_active: source.is_active !== false,
        sort_order: source.sort_order || 0,
        detection_rules: source.detection_rules || [],
      });
    } else {
      setForm({
        name: "",
        slug: "",
        description: "",
        parent_id: parentId || null,
        is_active: true,
        sort_order: 0,
        detection_rules: [],
      });
    }
    setError(null);
  }, [source, parentId, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name if creating new and slug hasn't been manually edited
    if (field === "name" && !isEdit) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      setForm((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const handleAddRule = () => {
    setForm((prev) => ({
      ...prev,
      detection_rules: [
        ...prev.detection_rules,
        { match_type: "utm_source", value: "" },
      ],
    }));
  };

  const handleUpdateRule = (index, field, value) => {
    setForm((prev) => {
      const rules = [...prev.detection_rules];
      rules[index] = { ...rules[index], [field]: value };
      // Set match_mode for prefix promo code rules
      if (field === "match_type" && value === "promo_code_prefix") {
        rules[index].match_type = "promo_code";
        rules[index].match_mode = "prefix";
      } else if (field === "match_type" && value !== "promo_code_prefix") {
        delete rules[index].match_mode;
      }
      return { ...prev, detection_rules: rules };
    });
  };

  const handleRemoveRule = (index) => {
    setForm((prev) => ({
      ...prev,
      detection_rules: prev.detection_rules.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError("Name and slug are required");
      return;
    }

    setSaving(true);
    setError(null);

    // Top-level sources must always remain active — the attribution engine
    // silently falls through if a slug lookup returns None.
    const payload = { ...form, is_active: form.parent_id ? form.is_active : true };

    let result;
    if (isEdit) {
      result = await updateCustomerSource(source.id, payload);
    } else {
      result = await createCustomerSource(payload);
    }

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose(true);
    }
  };

  const topLevelSources = (allSources || []).filter(
    (s) => !s.parent_id && s.id !== source?.id
  );

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {isEdit ? `Edit Source: ${source.name}` : "Add Customer Source"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Slug (unique identifier)"
              value={form.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              fullWidth
              required
              helperText="Machine-readable ID (e.g. paid_facebook)"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={8}>
            {parentId ? (
              // Locked — opened via "Add Sub-Source", parent is fixed
              <TextField
                label="Parent Source"
                value={topLevelSources.find((s) => s.id === parentId)?.name ?? ""}
                fullWidth
                disabled
                helperText="Parent is fixed when adding a sub-source from the table"
              />
            ) : (
              // Edit mode only — allow changing parent (but "None" is blocked for new sources)
              <FormControl fullWidth>
                <InputLabel>Parent Source</InputLabel>
                <Select
                  value={form.parent_id || ""}
                  onChange={(e) =>
                    handleChange("parent_id", e.target.value || null)
                  }
                  label="Parent Source"
                >
                  {topLevelSources.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={4}>
            {/* Hide toggle for top-level sources — deactivating them causes
                misattribution because _get_source_by_slug() silently returns None */}
            {form.parent_id && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => handleChange("is_active", e.target.checked)}
                  />
                }
                label="Active"
                sx={{ mt: 1 }}
              />
            )}
          </Grid>

          {/* Detection Rules */}
          <Grid item xs={12}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle2">
                Detection Rules
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRule}
              >
                Add Rule
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" mb={1}>
              Rules define how orders are matched to this source (e.g. utm_source
              = &quot;facebook&quot;)
            </Typography>

            {form.detection_rules.map((rule, index) => (
              <Box
                key={index}
                display="flex"
                gap={1}
                alignItems="center"
                mb={1}
              >
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <Select
                    value={
                      rule.match_mode === "prefix"
                        ? "promo_code_prefix"
                        : rule.match_type
                    }
                    onChange={(e) =>
                      handleUpdateRule(index, "match_type", e.target.value)
                    }
                  >
                    {MATCH_TYPES.map((mt) => (
                      <MenuItem key={mt.value} value={mt.value}>
                        {mt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Value"
                  value={rule.value || ""}
                  onChange={(e) =>
                    handleUpdateRule(index, "value", e.target.value)
                  }
                  fullWidth
                  placeholder={
                    rule.match_type === "utm_source"
                      ? "e.g. facebook"
                      : "e.g. AFFILIATE_"
                  }
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveRule(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {form.detection_rules.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", py: 1 }}
              >
                No detection rules — this source will only be assigned manually
                or as a fallback
              </Typography>
            )}
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? "Saving..." : isEdit ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
