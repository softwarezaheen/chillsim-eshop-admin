import React from "react";

import MuiSideNavigation from "./sidebar/MuiSideNavigation ";
import { Box, CssBaseline } from "@mui/material";
import TopNav from "./TopNav";

const AuthLayout = ({ children, open, setOpen, drawerWidth }) => {
  return (
    <Box sx={{ display: "flex", flexFlow: "row nowrap", gap: "2px" }}>
      <CssBaseline />

      <MuiSideNavigation
        open={open}
        drawerWidth={drawerWidth}
        setOpen={setOpen}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: "100vh",
          overflow: "hidden",
          overflowY: "scroll",
          // backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box className="px-3">
          <Box className="my-3">
            <TopNav openSide={open} setOpenSide={setOpen} />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
