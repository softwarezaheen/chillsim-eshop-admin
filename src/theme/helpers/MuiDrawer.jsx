import { alpha } from "@mui/system";

export const DrawerTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderRight: `1px solid ${theme.palette.divider}`,
          width: 280,
          display: "flex",
          fontWeight:700,
          flexDirection: "column",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: alpha(
              isDarkMode
                ? theme.palette.common.black
                : theme.palette.common.white,
              0.1
            ),
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(
              isDarkMode
                ? theme.palette.primary.light
                : theme.palette.primary.dark,
              0.6
            ),
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(
              isDarkMode
                ? theme.palette.primary.main
                : theme.palette.primary.dark,
              0.8
            ),
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          width: "100%",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          "&:hover": {
            backgroundColor:
              theme.palette.background.hover ||
           alpha(theme.palette.primary.main,0.09),
          },
          "&.Mui-selected": {
            // backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,
            // "&:hover": {
            //   backgroundColor: theme.palette.primary.dark,
            // },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.secondary.main,
          minWidth: "40px",
          display: "flex",
          justifyContent: "center",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 600,
          color: theme.palette.text.primary,
        },
      },
    },
  };
};
