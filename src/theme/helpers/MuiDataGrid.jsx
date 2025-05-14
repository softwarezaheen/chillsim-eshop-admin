export const DataGridTheme = ({ theme }) => {
  return {
    MuiDataGrid: {
      styleOverrides: {
        
        root: {
          backgroundColor: theme.palette.background.paper,
          border: "none",
          borderRadius: "16px", 
          "& .MuiDataGrid-cell:focus": {
            outline: "none !important", 
          },
          "& .MuiDataGrid-cell": {
            border: "none", 
          },
          "& .MuiDataGrid-row": {
            border: "none", 
          },
          "&, .MuiDataGrid-root, .MuiDataGrid-cell": {
            border: "none !important", 
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: theme.palette.background.default,
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderBottom: "none",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px", 
            overflow: "hidden",
          },
          "& .MuiDataGrid-columnHeadersInner": {
            borderBottom: "none !important", 
          },
        },
        columnHeaders: {
          backgroundColor: theme.palette.background.default,
          fontWeight: 600,
          color: theme.palette.text.primary,
          borderBottom: "none", 
        },
        row: {
          "&:hover": {
            backgroundColor: "transparent",
          },
        },
      },
    },
  };
};
