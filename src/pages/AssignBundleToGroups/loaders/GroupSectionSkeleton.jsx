import React from "react";
import { Box, Skeleton, Paper } from "@mui/material";
import GroupTagSkeleton from "./GroupTagSkeleton";

export default function GroupSectionSkeleton() {
  return (
    <div style={{ margin: "40px 0" }}>
      <Box item xs={12} className="mt-2 mb-4">
        <Skeleton
          variant="text"
          width={300}
          height={24}
          sx={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}
        />
      </Box>
      <Paper
        elevation={0}
        sx={{
          boxShadow: "none",
          overflow: "hidden",
          border: "1px solid #d1d5db",
          borderRadius: "18px",
        }}
      >
        <Box
          sx={{
            minHeight: "48px",
            background: "#9ca3af",
            padding: "0px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Skeleton
            variant="text"
            width={150}
            height={24}
            sx={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }}
          />
        </Box>

        <Box
          sx={{
            padding: "20px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <GroupTagSkeleton />
        </Box>
      </Paper>
    </div>
  );
}
