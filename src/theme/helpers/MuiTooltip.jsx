
export const TooltipTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    styleOverrides: {
      tooltip: {
        backgroundColor: theme.palette.background.default,
        color: isDarkMode
        ? theme.palette.text.primary
        : theme.palette.text.secondary,
        border: "none",
        boxShadow: "none",
      },
      arrow: {
        color: theme.palette.background.default, 
      },
    },
  };
};
