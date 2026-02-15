import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import dayjs from "dayjs";

const DetailRow = ({ label, value, bold = false }) => (
  <Box sx={{ display: "flex", py: 0.5 }}>
    <Typography variant="body2" sx={{ minWidth: "180px", color: "text.secondary" }}>
      {label}:
    </Typography>
    <Typography
      variant="body2"
      sx={{ fontWeight: bold ? "bold" : "normal", wordBreak: "break-all" }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

const statusColorMap = {
  active: "success",
  pending: "warning",
  expired: "default",
  depleted: "error",
};

const formatData = (mb) => {
  if (!mb || mb === 0) return "0 MB";
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${Number(mb).toFixed(0)} MB`;
};

export default function BundleDetailModal({ open, bundle, onClose }) {
  if (!bundle) return null;

  const isUnlimited = bundle.is_unlimited;
  const usagePercent = isUnlimited
    ? null
    : bundle.data_allocated_mb > 0
    ? Math.min(100, ((bundle.data_used_mb || 0) / bundle.data_allocated_mb) * 100)
    : 0;

  // Parse countries from bundle data
  const countries = bundle.countries || [];
  const countryList = Array.isArray(countries)
    ? countries
        .map((c) => (typeof c === "string" ? c : c?.country_name || c?.country_code || c?.iso2 || ""))
        .filter(Boolean)
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6">Bundle Details</Typography>
          <Chip
            label={bundle.bundle_status}
            color={statusColorMap[bundle.bundle_status] || "default"}
            size="small"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Bundle Info */}
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          Bundle Information
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          <DetailRow label="Bundle Name" value={bundle.bundle_name} />
          <DetailRow label="Description" value={bundle.bundle_description} />
          <DetailRow label="Bundle Code" value={bundle.bundle_code} />
          <DetailRow label="Plan Type" value={bundle.plan_type} />
          <DetailRow label="Bundle Type" value={bundle.bundle_type} />
          <DetailRow label="ICCID" value={bundle.iccid} />
          <DetailRow label="eSIM Hub Order ID" value={bundle.esim_hub_order_id} />
          <DetailRow label="User Order ID" value={bundle.user_order_id} />
          {bundle.price != null && (
            <DetailRow label="Price" value={`€${Number(bundle.price).toFixed(2)}`} bold />
          )}
        </Box>

        {/* Data Usage */}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          Data Usage
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          {isUnlimited ? (
            <Chip label="Unlimited Data" color="info" variant="outlined" />
          ) : (
            <>
              <DetailRow
                label="Data Allocated"
                value={formatData(bundle.data_allocated_mb)}
              />
              <DetailRow
                label="Data Used"
                value={formatData(bundle.data_used_mb)}
              />
              <DetailRow
                label="Data Remaining"
                value={formatData(bundle.data_remaining_mb)}
              />
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={usagePercent || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={usagePercent > 90 ? "error" : usagePercent > 70 ? "warning" : "primary"}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {usagePercent?.toFixed(1)}% used
                </Typography>
              </Box>
            </>
          )}
          {bundle.data_display && (
            <DetailRow label="Display" value={bundle.data_display} />
          )}
          {bundle.validity_display && (
            <DetailRow label="Validity" value={bundle.validity_display} />
          )}
        </Box>

        {/* Dates */}
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          Timeline
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          <DetailRow
            label="Plan Started"
            value={bundle.plan_started ? dayjs(bundle.plan_started).format("DD-MM-YYYY HH:mm") : null}
          />
          <DetailRow
            label="Started At"
            value={bundle.started_at ? dayjs(bundle.started_at).format("DD-MM-YYYY HH:mm") : null}
          />
          <DetailRow
            label="Validity End"
            value={bundle.validity_end_date ? dayjs(bundle.validity_end_date).format("DD-MM-YYYY HH:mm") : null}
          />
          <DetailRow
            label="Depleted At"
            value={bundle.depleted_at ? dayjs(bundle.depleted_at).format("DD-MM-YYYY HH:mm") : null}
          />
          <DetailRow
            label="Expired At"
            value={bundle.expired_at ? dayjs(bundle.expired_at).format("DD-MM-YYYY HH:mm") : null}
          />
          <DetailRow
            label="Created At"
            value={bundle.created_at ? dayjs(bundle.created_at).format("DD-MM-YYYY HH:mm") : null}
          />
        </Box>

        {/* Countries */}
        {countryList.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
              Countries ({countryList.length})
            </Typography>
            <Box sx={{ pl: 2, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {countryList.map((country, idx) => (
                <Chip key={idx} label={country} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
