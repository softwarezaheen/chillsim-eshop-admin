import React from "react";
import { Box, CssBaseline, useTheme } from "@mui/material";
import TopNav from "./TopNav";

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <>
      <CssBaseline />
      <TopNav />
      <div className="flex-grow w-[90%] max-w-xxl mx-auto py-8">{children}</div>
    </>
  );
};

export default MainLayout;
