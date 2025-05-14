import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";

const EmptyComponent = () => {
  const theme = useTheme();

  return (
    <Box
      className="flex flex-col items-center justify-center min-h-full"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.paper,
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center", mt: 1, maxWidth: "80%" }}
      >
        No Data Available
      </Typography>
    </Box>
  );
};

export default EmptyComponent;
