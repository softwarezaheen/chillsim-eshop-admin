import BlockIcon from "@mui/icons-material/Block";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function IPBlockedPage() {
  const navigate = useNavigate();
  const [detail, setDetail] = useState("Your IP address is not in the admin whitelist.");

  useEffect(() => {
    const stored = sessionStorage.getItem("ip_block_detail");
    if (stored) {
      setDetail(stored);
      sessionStorage.removeItem("ip_block_detail");
    }
  }, []);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Paper elevation={3} sx={{ p: 5, maxWidth: 480, textAlign: "center" }}>
        <BlockIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={1}>
          {detail}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Contact your administrator to have your IP address added to the whitelist.
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/signin")}>
          Back to Sign In
        </Button>
      </Paper>
    </Box>
  );
}
