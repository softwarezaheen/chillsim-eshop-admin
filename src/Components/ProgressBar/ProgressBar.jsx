import React from "react";
import { Typography, Box } from "@mui/material";

export default function ProgressBar({
  progress = 0,
  triggers = [],
  barColor = "bg-blue-500",
  triggerColor = "bg-red-500",
  balanceLimit = 0,
  threshold = 0,
}) {
  return (
    <div className="p-4 w-full text-white">
      {/* Balance Limit Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <Typography variant="body2">Balance Limit</Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(balanceLimit)}
        </Typography>
      </Box>

      {/* Progress Bar Container */}
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress Bar */}
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${progress}%` }}
        ></div>
        {/* Trigger Lines */}
        {triggers.map((trigger, index) => (
          <div
            key={index}
            className={`absolute top-0 h-full w-1 ${triggerColor}`}
            style={{ left: `${trigger}%` }}
          ></div>
        ))}
      </div>

      {/* Threshold Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        <Typography variant="body2">Threshold</Typography>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(threshold)}
        </Typography>
      </Box>
    </div>
  );
}
