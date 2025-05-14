import { alpha } from "@mui/system";

export const InputTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    styleOverrides: {
      root: {
        borderRadius: "8px",
        "& .MuiOutlinedInput-root": {
          backgroundColor: isDarkMode
            ? alpha(theme.palette.primary.light, 0.07)
            : theme.palette.background.paper,
          borderRadius: "16px",
        },
        "& .MuiInputLabel-root": {
          // color: isDarkMode
          //   ?  theme.palette.secondary.light
          //   : theme.palette.secondary.dark,
          fontWeight: 500,
        },
        "& .MuiInputLabel-root.Mui-focused": {
          fontWeight: 600,
        },
      },
      input: {
        color: isDarkMode
          ? theme.palette.text.primary
          : theme.palette.text.secondary,
        "&:-webkit-autofill": {
          WebkitBoxShadow: "0 0 0px 1000px transparent inset !important",
          backgroundColor: "transparent !important",
          color: "inherit !important",
        },
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
