import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Grid from "@mui/material/Grid2";

// Card components — each loads its own data independently
import UserInfoCard from "./components/UserInfoCard";
import UserOrdersCard from "./components/UserOrdersCard";
import UserEsimProfilesCard from "./components/UserEsimProfilesCard";
import UserBundlesCard from "./components/UserBundlesCard";
import UserDevicesCard from "./components/UserDevicesCard";
import UserWalletTransactionsCard from "./components/UserWalletTransactionsCard";
import UserPromoUsageCard from "./components/UserPromoUsageCard";
import UserFinancialDocsCard from "./components/UserFinancialDocsCard";

// Modals
import OrderDetailModal from "./components/OrderDetailModal";
import EsimProfileDetailModal from "./components/EsimProfileDetailModal";
import BundleDetailModal from "./components/BundleDetailModal";

const UserDetail = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  
  // Refresh state for triggering re-fetch after modal actions
  const [esimRefreshKey, setEsimRefreshKey] = useState(0);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/users")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          User Details
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: "monospace", ml: 1 }}
        >
          {userId}
        </Typography>
      </Box>

      {/* Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Row 1: Full-width User Info */}
        <Grid size={12}>
          <UserInfoCard userId={userId} />
        </Grid>

        {/* Row 2: Orders (left) + eSIM Profiles (right) */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserOrdersCard
            userId={userId}
            onOrderClick={(order) => setSelectedOrder(order)}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserEsimProfilesCard
            userId={userId}
            onProfileClick={(profile) => setSelectedProfile(profile)}
            key={`esim-${esimRefreshKey}`}
          />
        </Grid>

        {/* Row 3: Bundles (left) + Devices (right) */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserBundlesCard
            userId={userId}
            onBundleClick={(bundle) => setSelectedBundle(bundle)}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserDevicesCard userId={userId} />
        </Grid>

        {/* Row 4: Wallet Transactions (left) + Promotions (right) */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserWalletTransactionsCard userId={userId} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <UserPromoUsageCard userId={userId} />
        </Grid>

        {/* Row 5: Financial Documents (full-width) */}
        <Grid size={12}>
          <UserFinancialDocsCard userId={userId} />
        </Grid>
      </Grid>

      {/* Modals */}
      <OrderDetailModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
      <EsimProfileDetailModal
        open={!!selectedProfile}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onRefresh={() => {
          // Refresh the card in background
          setEsimRefreshKey((prev) => prev + 1);
        }}
        onProfileUpdate={(updatedProfile) => {
          // Update modal data in-place without closing
          setSelectedProfile(updatedProfile);
        }}
      />
      <BundleDetailModal
        open={!!selectedBundle}
        bundle={selectedBundle}
        onClose={() => setSelectedBundle(null)}
      />
    </Box>
  );
};

export default UserDetail;
