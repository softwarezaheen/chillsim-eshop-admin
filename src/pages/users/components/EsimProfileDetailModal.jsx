import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Close as CloseIcon, QrCode as QrIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", py: 0.5 }}>
    <Typography variant="body2" sx={{ minWidth: "180px", color: "text.secondary" }}>
      {label}:
    </Typography>
    <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
      {value || "—"}
    </Typography>
  </Box>
);

const statusColorMap = {
  active: "success",
  delivered: "info",
  expired: "error",
};

export default function EsimProfileDetailModal({ open, profile, onClose, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);

  if (!profile) return null;

  const bundles = profile.bundles || [];

  const handleRefreshConsumption = async () => {
    setRefreshing(true);
    try {
      // Call the refresh API (ICCID is available in profile)
      const response = await fetch(`${import.meta.env.VITE_API_SERVER_URL}/api/v1/admin/consumption/sync/${profile.iccid}`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': localStorage.getItem('admin_key'),
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Consumption data refreshed successfully');
        // Trigger parent refresh if callback provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(result.message || 'Failed to refresh consumption data');
      }
    } catch (error) {
      toast.error('Failed to refresh consumption data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6">eSIM Profile Details</Typography>
          <Chip
            label={profile.profile_status}
            color={statusColorMap[profile.profile_status] || "default"}
            size="small"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Profile Info */}
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          Profile Information
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          <DetailRow label="ICCID" value={profile.iccid} />
          <DetailRow label="Order ID" value={profile.user_order_id} />
          <DetailRow label="eSIM Hub Order ID" value={profile.esim_hub_order_id} />
          <DetailRow label="Status" value={profile.profile_status} />
          <DetailRow label="Label" value={profile.label} />
          <DetailRow label="Validity" value={profile.validity} />
          <DetailRow label="Allow Top-up" value={profile.allow_topup ? "Yes" : "No"} />
          <DetailRow
            label="Expiry Date"
            value={
              profile.profile_expiry_date
                ? dayjs(profile.profile_expiry_date).format("DD-MM-YYYY HH:mm")
                : null
            }
          />
          <DetailRow
            label="Last Consumption Sync"
            value={
              profile.last_consumption_sync
                ? dayjs(profile.last_consumption_sync).format("DD-MM-YYYY HH:mm")
                : null
            }
          />
          <DetailRow
            label="Created At"
            value={
              profile.created_at
                ? dayjs(profile.created_at).format("DD-MM-YYYY HH:mm")
                : null
            }
          />
        </Box>

        {/* Activation Details */}
        <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          Activation Details
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          <DetailRow label="SMDP Address" value={profile.smdp_address} />
          <DetailRow label="Activation Code" value={profile.activation_code} />
          {profile.smdp_address && profile.activation_code && (
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <QrIcon color="action" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                QR: LPA:1${profile.smdp_address}$${profile.activation_code}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Associated Bundles */}
        {bundles.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: "bold" }}>
                Associated Bundles ({bundles.length})
              </Typography>
              <IconButton
                size="small"
                onClick={handleRefreshConsumption}
                disabled={refreshing}
                title="Refresh consumption data"
                sx={{ color: "primary.main" }}
              >
                <RefreshIcon fontSize="small" sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bundle Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Started At</TableCell>
                    <TableCell>Expiration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bundles.map((bundle, idx) => (
                    <TableRow key={bundle.id || idx}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {bundle.bundle_name || bundle.bundle_data?.bundle_name || "—"}
                        </Typography>
                        {bundle.bundle_description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                            {bundle.bundle_description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bundle.bundle_status || "unknown"}
                          color={statusColorMap[bundle.bundle_status] || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {bundle.data_used_mb != null && bundle.data_allocated_mb != null
                            ? bundle.data_allocated_mb > 0
                              ? `${bundle.data_used_mb} / ${bundle.data_allocated_mb} MB`
                              : "Unlimited"
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {bundle.started_at
                            ? dayjs(bundle.started_at).format("DD/MM/YY HH:mm")
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {bundle.expired_at
                            ? dayjs(bundle.expired_at).format("DD/MM/YY HH:mm")
                            : bundle.validity_end_date
                            ? dayjs(bundle.validity_end_date).format("DD/MM/YY HH:mm")
                            : "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
