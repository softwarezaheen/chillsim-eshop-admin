import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
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

const calculateTotalAmount = (order) => {
  const modifiedAmount = order.modified_amount || 0;
  const fee = order.fee || 0;
  const vat = order.vat || 0;
  if (order.tax_mode === "exclusive") {
    return modifiedAmount + fee + vat;
  }
  return modifiedAmount + fee;
};

const convertToDisplayCurrency = (amount, order) => {
  if (order.exchange_rate && order.exchange_rate !== 1) {
    return amount / order.exchange_rate;
  }
  return amount;
};

const getBundleInfo = (bundleData) => {
  if (!bundleData) return { name: "N/A", subtitle: null };
  const data = typeof bundleData === "string" ? JSON.parse(bundleData) : bundleData;
  return {
    name: data?.bundle_name || data?.bundle_marketing_name || "N/A",
    subtitle: data?.display_subtitle || data?.bundle_marketing_name || null,
    description: data?.gprs_limit_display || null,
    validity: data?.validity_display || null,
  };
};

export default function OrderDetailModal({ open, order, onClose }) {
  if (!order) return null;

  const bundleInfo = getBundleInfo(order.bundle_data);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6">Order Details</Typography>
          <Chip
            label={order.payment_status}
            color={
              order.payment_status === "success"
                ? "success"
                : order.payment_status === "pending"
                ? "warning"
                : "error"
            }
            size="small"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Section 1: Order Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
              Order Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <DetailRow label="Order ID" value={order.order_id || order.id} />
              <DetailRow label="Order Type" value={order.order_type} />
              <DetailRow label="Order Status" value={order.order_status} />
              <DetailRow label="Payment Status" value={order.payment_status} />
              <DetailRow
                label="Created At"
                value={order.created_at ? dayjs(order.created_at).format("DD-MM-YYYY HH:mm:ss") : null}
              />
              {order.payment_time && (
                <DetailRow
                  label="Payment Time"
                  value={dayjs(order.payment_time).format("DD-MM-YYYY HH:mm:ss")}
                />
              )}
              {order.callback_time && (
                <DetailRow
                  label="Callback Time"
                  value={dayjs(order.callback_time).format("DD-MM-YYYY HH:mm:ss")}
                />
              )}
            </Box>
          </Grid>

          {/* Section 2: Payment Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
              Payment Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <DetailRow label="Payment Intent" value={order.payment_intent_code} />
              <DetailRow label="Payment Type" value={order.payment_type} />
              <DetailRow label="Currency" value={order.currency} />
              <DetailRow label="Display Currency" value={order.display_currency || order.currency} />
              <DetailRow label="Exchange Rate" value={order.exchange_rate || "1.0"} />
              <Divider sx={{ my: 1 }} />
              <DetailRow
                label="Original Amount"
                value={`${(order.original_amount || order.amount || 0).toFixed(2)} ${order.currency || "EUR"}`}
              />
              <DetailRow
                label="Modified Amount"
                value={`${(order.modified_amount || 0).toFixed(2)} ${order.currency || "EUR"}`}
              />
              <DetailRow
                label="Fee"
                value={`${(order.fee || 0).toFixed(2)} ${order.currency || "EUR"}`}
              />
              <DetailRow
                label="VAT"
                value={`${(order.vat || 0).toFixed(2)} ${order.currency || "EUR"}`}
              />
              <DetailRow
                label="Total Amount"
                value={`${calculateTotalAmount(order).toFixed(2)} ${order.currency || "EUR"}`}
                bold
              />
              {order.display_currency && order.display_currency !== order.currency && (
                <DetailRow
                  label="Total Amount (EUR)"
                  value={`${convertToDisplayCurrency(calculateTotalAmount(order), order).toFixed(2)} EUR`}
                  bold
                />
              )}
              {order.cashback_amount > 0 && (
                <DetailRow
                  label="Cashback"
                  value={`${order.cashback_amount.toFixed(2)} EUR`}
                />
              )}
            </Box>
          </Grid>

          {/* Section 3: Bundle & Promotions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
              Bundle & Promotions
            </Typography>
            <Box sx={{ pl: 2 }}>
              <DetailRow label="Bundle ID" value={order.bundle_id} />
              <DetailRow label="Bundle Name" value={bundleInfo.name} />
              {bundleInfo.subtitle && (
                <DetailRow label="Description" value={bundleInfo.subtitle} />
              )}
              {bundleInfo.description && (
                <DetailRow label="Data" value={bundleInfo.description} />
              )}
              {bundleInfo.validity && (
                <DetailRow label="Validity" value={bundleInfo.validity} />
              )}
              {order.iccid && (
                <DetailRow
                  label="ICCID"
                  value={
                    <Typography
                      variant="body2"
                      component="span"
                      color="primary.main"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      {order.iccid}
                    </Typography>
                  }
                />
              )}
              <DetailRow label="Promo Code" value={order.promo_code} />
              <DetailRow label="Referral Code" value={order.referral_code} />
              {order.esim_order_id && (
                <DetailRow label="eSIM Order ID" value={order.esim_order_id} />
              )}
            </Box>
          </Grid>

          {/* Section 4: Documents */}
          {(order.invoice_id || order.credit_note_id || order.pdf_url) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
                Documents
              </Typography>
              <Box sx={{ pl: 2 }}>
                {order.invoice_id && <DetailRow label="Invoice ID" value={order.invoice_id} />}
                {order.credit_note_id && (
                  <DetailRow label="Credit Note ID" value={order.credit_note_id} />
                )}
                {order.pdf_url && (
                  <DetailRow
                    label="PDF"
                    value={
                      <a
                        href={order.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Document
                      </a>
                    }
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
