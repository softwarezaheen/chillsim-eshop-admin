import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import MainLayout from "../../Components/layout/MainLayout";
import AuthLayout from "../../Components/layout/AuthLayout";
import { getMyIp } from "../apis/ipWhitelistAPI";

const RouteWrapper = ({
  shouldbeLoggedIn,
  element,
  isPrivate,
  isAuthRestricted,
}) => {
  const { isAuthenticated } = useSelector((state) => state.authentication);
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const [ipChecking, setIpChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIpChecking(false);
      return;
    }
    // Fire an admin API call immediately on mount.
    // If the IP is blocked the adminUsersAPI interceptor will redirect to /ip-blocked.
    // If the whitelist is disabled or this IP is allowed, we simply proceed.
    getMyIp()
      .catch(() => { /* interceptor already handled the 403 redirect */ })
      .finally(() => setIpChecking(false));
  }, [isAuthenticated]);

  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  if (shouldbeLoggedIn && !isAuthenticated) {
    return (
      <Navigate
        to={
          location?.pathname
            ? `/signin?next=${encodeURIComponent(location.pathname)}`
            : "signin"
        }
        replace
      />
    );
  } else if (!shouldbeLoggedIn && isAuthenticated) {
    return <Navigate to={next ? decodeURIComponent(next) : "/users"} />;
  }

  if (ipChecking) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const Layout = isAuthenticated ? AuthLayout : MainLayout;

  return (
    <Layout
      isPublic={!isPrivate && !isAuthRestricted}
      isAuthRestricted={isAuthRestricted}
      open={open}
      setOpen={setOpen}
    >
      <Outlet />
    </Layout>
  );
};

export default RouteWrapper;
