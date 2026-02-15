import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Skeleton,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccountBalanceWallet as WalletIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getUserInfo } from "../../../core/apis/adminUsersAPI";

const accountSourceLabels = {
  email: "Email",
  google: "Google",
  apple: "Apple",
  phone: "Phone",
};

const InfoRow = ({ icon, label, value }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.75 }}>
    {icon && <Box sx={{ color: "text.secondary", mt: 0.3 }}>{icon}</Box>}
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  </Box>
);

export default function UserInfoCard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserInfo(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setData(result.data);
      }
    } catch (e) {
      toast.error("Failed to load user info");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card>
        <CardHeader title={<Skeleton width={200} />} />
        <CardContent>
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.user_id) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" align="center">
            User not found
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const source = data.account_source || "email";
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ");
  const fullAddress = [data.billing_address, data.city, data.state, data.country]
    .filter(Boolean)
    .join(", ");
  const hasCompanyInfo = data.company_name || data.vat_code || data.trade_registry;

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h6">User Information</Typography>
            <Chip
              label={accountSourceLabels[source] || source}
              size="small"
              color="primary"
              variant="outlined"
            />
            {data.email_verified && (
              <Chip label="Email Verified" size="small" color="success" variant="outlined" />
            )}
          </Box>
        }
        action={
          <Chip
            icon={<WalletIcon />}
            label={`${data.wallet_currency || "EUR"} ${Number(data.wallet_balance || 0).toFixed(2)}`}
            color={data.wallet_balance > 0 ? "success" : "default"}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.9rem" }}
          />
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {/* Row 1: Identity & Address */}
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <InfoRow icon={<PersonIcon fontSize="small" />} label="Full Name" value={fullName} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={data.email} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone / MSISDN" value={data.msisdn || data.phone} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            <InfoRow icon={<LocationIcon fontSize="small" />} label="Address" value={fullAddress} />
          </Grid>

          {/* Row 2: Company Info (only if exists) */}
          {hasCompanyInfo && (
            <>
              {data.company_name && (
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoRow icon={<BusinessIcon fontSize="small" />} label="Company" value={data.company_name} />
                </Grid>
              )}
              {data.vat_code && (
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoRow label="VAT Code" value={data.vat_code} />
                </Grid>
              )}
              {data.trade_registry && (
                <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
                  <InfoRow label="Trade Registry" value={data.trade_registry} />
                </Grid>
              )}
            </>
          )}

          {/* Account Meta */}
          <Grid item size={{ xs: 12 }}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
            <InfoRow
              label="Account Created"
              value={data.created_at ? new Date(data.created_at).toLocaleDateString() : "—"}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
            <InfoRow
              label="Last Sign In"
              value={data.last_sign_in_at ? new Date(data.last_sign_in_at).toLocaleString() : "—"}
            />
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
            <InfoRow
              label="Auth Providers"
              value={
                data.providers
                  ? (Array.isArray(data.providers) ? data.providers : [data.providers]).join(", ")
                  : source
              }
            />
          </Grid>
          {data.referral_code && (
            <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
              <InfoRow
                label="Referral Code"
                value={data.referral_code}
              />
            </Grid>
          )}
          <Grid item size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, py: 0.75 }}>
              <Box sx={{ color: "text.secondary", mt: 0.3 }}>
                <CampaignIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Marketing Consent
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={data.marketing_consent ? "Subscribed" : "Not Subscribed"}
                    size="small"
                    color={data.marketing_consent ? "success" : "default"}
                    variant="outlined"
                  />
                  {data.marketing_consent_updated_at && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(data.marketing_consent_updated_at).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
