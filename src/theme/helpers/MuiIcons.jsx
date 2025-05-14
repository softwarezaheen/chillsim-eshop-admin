export const IconTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";
  return {
    styleOverrides: {
      root: {
        color: isDarkMode ? "white" : "",
      },
    },
  };
};
