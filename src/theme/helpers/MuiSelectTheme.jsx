import { alpha } from "@mui/system";

export const SelectTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    styleOverrides: {
      root: {
        borderRadius: "16px",
        backgroundColor: isDarkMode
          ? alpha(theme.palette.primary.light, 0.07)
          : theme.palette.background.paper,
        "& .MuiOutlinedInput-root": {
          backgroundColor: isDarkMode
            ? alpha(theme.palette.primary.light, 0.07)
            : theme.palette.background.paper,
          borderRadius: "16px",
        },
        "& .MuiInputLabel-root": {
          color: isDarkMode
            ? theme.palette.secondary.light
            : theme.palette.secondary.dark,
          fontWeight: 500,
        },
        "& .MuiInputLabel-root.Mui-focused": {
          fontWeight: 600,
        },
      },
      select: {
        color: isDarkMode
          ? theme.palette.text.primary
          : theme.palette.text.secondary,
      },
      icon: {
        color: isDarkMode
          ? theme.palette.text.primary
          : theme.palette.text.secondary,
      },
      menu: {
        backgroundColor: isDarkMode
          ? theme.palette.background.default
          : theme.palette.background.paper,
      },
      paper: {
        backgroundColor: isDarkMode
          ? theme.palette.background.default
          : theme.palette.background.paper,
        color: isDarkMode
          ? theme.palette.text.primary
          : theme.palette.text.secondary,
      },
    },
  };
};
