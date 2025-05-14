export const TableTheme = ({ theme }) => {
  const isDarkMode = theme.palette.mode === "dark";
  return {
    MuiTableContainer: {
      styleOverrides: {
        root: {
          minHeight: "400px",
          backgroundColor: theme.palette.background.paper,
          borderRadius: "12px",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          border: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "10px !important",
          borderBottom: "none",
        },
        head: {
          fontWeight: 600,
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.background.default,
          "&:first-of-type": {
            borderTopLeftRadius: "16px",
          },
          "&:last-of-type": {
            borderTopRightRadius: "16px",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even)": {
            backgroundColor: !isDarkMode
              ? theme.palette.background.default
              : theme.palette.primary.dark, // even rows
          },
          "&:nth-of-type(odd)": {
            backgroundColor: !isDarkMode
              ? "#ffffff"
              : theme.palette.primary.main, // odd rows
          },
        },
      },
    },
  };
};
