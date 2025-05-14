import { alpha } from "@mui/system";

export const AsyncPaginateTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    control: (base, state) => ({
      ...base,
      cursor: "pointer",
      backgroundColor: isDarkMode
        ? alpha(theme.palette.primary.light, 0.07)
        : theme.palette.background.paper,
      color: theme.palette.text.primary,
      minHeight: "35px",
      borderRadius: "16px",
      border: `1px solid ${
        state.isFocused ? theme.palette.primary.main : theme.palette.divider
      }`,
      boxShadow: state.isFocused
        ? `0px 0px 5px ${alpha(theme.palette.primary.main, 0.2)}`
        : "none",
      transition: "all 0.3s ease",
      borderColor: isDarkMode ? theme.palette.primary.light : "#c8c4c4",
      "&:hover": {
        borderColor: theme.palette.primary.main,
      },
      input: {
        color: isDarkMode ? "white" : "black",
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode
        ? theme.palette.background.paper
        : theme.palette.background.default,
      borderRadius: "8px",
      border: `1px solid ${theme.palette.divider}`,
      zIndex: 9999,
      position: "absolute",
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? alpha(theme.palette.primary.main, 0.4)
        : isFocused
        ? alpha(theme.palette.primary.main, 0.2)
        : "transparent",
      padding: "10px",
      borderRadius: "16px",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    }),
    singleValue: (base) => ({
      ...base,
      color: theme.palette.text.primary,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: theme.palette.text.secondary,
      "&:hover": {
        color: alpha(theme.palette.primary.main, 0.5),
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "transparent",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "white" : "black",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "red",
      backgroundColor: isDarkMode
        ? "#1e293b"
        : alpha(theme.palette.primary.main, 0.1),
      borderRadius: "12px",
      padding: "2px 6px",
      display: "flex",
      alignItems: "center",
    }),
    multiValueLabel: (base) => ({
      ...base,

      color: isDarkMode ? "white" : theme.palette.primary.main,
      fontWeight: 500,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDarkMode ? "white" : theme.palette.primary.main,
      cursor: "pointer",
      ":hover": {
        color: theme.palette.primary.dark,
      },
    }),
  };
};
