import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getAvailablePromoCodes,
  getFeedConfig,
  updateFeedPromoCode,
  regenerateXMLFeed,
  getXMLFeedURL,
} from "../../core/apis/xmlFeedAPI";

const XMLFeedManagement = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [promoCodes, setPromoCodes] = useState([]);
  const [currentPromoCode, setCurrentPromoCode] = useState("");
  const [selectedPromoCode, setSelectedPromoCode] = useState("");
  const [feedStats, setFeedStats] = useState(null);
  const [currency] = useState("EUR");
  const [locale] = useState("en");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load available promo codes
      const promoResponse = await getAvailablePromoCodes();
      if (promoResponse.status === "success" && promoResponse.data) {
        setPromoCodes(promoResponse.data);
      }

      // Load current config
      const configResponse = await getFeedConfig();
      if (configResponse.status === "success" && configResponse.data) {
        const currentCode = configResponse.data.promo_code || "";
        setCurrentPromoCode(currentCode);
        setSelectedPromoCode(currentCode);
      }
    } catch (error) {
      toast.error(`Failed to load feed configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromoCode = async () => {
    if (!selectedPromoCode) {
      toast.warning("Please select a promo code");
      return;
    }

    setSaving(true);
    try {
      const response = await updateFeedPromoCode(selectedPromoCode);
      if (response.status === "success") {
        setCurrentPromoCode(selectedPromoCode);
        toast.success(response.message || "Promo code updated successfully");
      } else {
        toast.error(response.message || "Failed to update promo code");
      }
    } catch (error) {
      toast.error(`Failed to update promo code: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateFeed = async () => {
    setRegenerating(true);
    try {
      const response = await regenerateXMLFeed(currency, locale);
      // Handle both response formats: {success: true} and {status: "success"}
      if (response.success === true || response.status === "success") {
        if (response.data) {
          setFeedStats({
            bundle_count: response.data.bundle_count,
            promo_code: response.data.promo_code,
            timestamp: response.data.timestamp,
            url: response.data.url,
          });
        }
        toast.success(response.message || "Feed regenerated successfully");
      } else {
        toast.error(response.message || "Failed to regenerate feed");
      }
    } catch (error) {
      toast.error(`Failed to regenerate feed: ${error.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadFeed = () => {
    const url = getXMLFeedURL(currency, locale);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        XML Feed Management
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
        Manage the impact.com XML product feed promo code and regenerate the feed
      </Typography>

      <Grid2 container spacing={3}>
        {/* Promo Code Configuration */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Promo Code Configuration
              </Typography>

              {currentPromoCode && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Current promo code: <strong>{currentPromoCode}</strong>
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Promo Code</InputLabel>
                <Select
                  value={selectedPromoCode}
                  onChange={(e) => setSelectedPromoCode(e.target.value)}
                  label="Select Promo Code"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {promoCodes.map((promo) => (
                    <MenuItem key={promo.code} value={promo.code}>
                      {promo.code} - {promo.name} ({promo.amount}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSavePromoCode}
                disabled={saving || selectedPromoCode === currentPromoCode}
              >
                {saving ? "Saving..." : "Update Promo Code"}
              </Button>
            </CardContent>
          </Card>
        </Grid2>

        {/* Feed Generation */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feed Generation
              </Typography>

              {feedStats && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Last Generated:</strong>{" "}
                      {new Date(feedStats.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bundles:</strong> {feedStats.bundle_count}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Promo Code:</strong> {feedStats.promo_code || "None"}
                    </Typography>
                  </Alert>
                </Box>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  startIcon={regenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
                  onClick={handleRegenerateFeed}
                  disabled={regenerating}
                >
                  {regenerating ? "Regenerating..." : "Regenerate Feed"}
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadFeed}
                >
                  Download Feed
                </Button>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Feed URL for impact.com:
                  <br />
                  <code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {getXMLFeedURL(currency, locale)}
                  </code>
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid2>

        {/* Information */}
        <Grid2 size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>
                    <strong>Select a promo code:</strong> Choose from available PROMOTION type
                    codes
                  </li>
                  <li>
                    <strong>Update configuration:</strong> Click &quot;Update Promo Code&quot; to save
                  </li>
                  <li>
                    <strong>Regenerate feed:</strong> Click &quot;Regenerate Feed&quot; to apply the new
                    promo code
                  </li>
                  <li>
                    <strong>Automatic updates:</strong> Feed regenerates daily at 5 AM with the
                    configured promo code
                  </li>
                  <li>
                    <strong>Download/Share:</strong> Use the feed URL for impact.com integration
                  </li>
                </ol>
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default XMLFeedManagement;
