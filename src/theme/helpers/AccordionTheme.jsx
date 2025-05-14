export const AccordionTheme = ({ theme }) => {
  return {
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: "none",
          backgroundColor: theme.palette.whiteColor,
          boxShadow: "0px 0px 5px 2px rgba(0, 0, 0, 0.05)",
          borderRadius: "7px 7px 0px 0px",
          marginTop: "10px",
          ".Mui-disabled": {
            backgroundColor: theme.palette.whiteColor,
            color: theme.palette.secondaryColor,
          },
          "&::before": {
            display: "none",
          },

          "@media (max-width:400px)": {
            marginTop: "20px",
            width: "100%",
            margin: "auto",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          background: theme.palette.primary.main,
          padding: "1px 15px 1px",
          borderRadius: "7px 7px 0px 0px",
          "@media (max-width:900px)": {
            padding: "1px 10px 1px",
          },
          "&.Mui-expanded": {
            padding: "10px",
            "@media (max-width:900px)": {
              padding: "10px",
            },
            transition: "0.5s all ease-in-out",
            height: "1px",
          },
        },
      },
    },
  };
};
