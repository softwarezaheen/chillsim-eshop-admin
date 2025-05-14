import { alpha } from "@mui/system";

export const DatePickerTheme = ({theme}) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    input: (base) => ({
      ...base,
      width: "100%",
      padding: "10px 14px",
      borderRadius: "16px",
      
      border: `1px solid ${theme.palette.divider}`,
      color: isDarkMode ? theme.palette.text.primary : theme.palette.text.secondary,
      fontSize: "14px",
      outline: "none",
      transition: "border 0.3s ease",
      "&:focus": {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 5px ${alpha(theme.palette.primary.main, 0.3)}`,
      },
    }),
    calendar: {
      "& .react-datepicker": {
        borderRadius: "16px",
        // backgroundColor: isDarkMode
        //   ? theme.palette.background.default
        //   : theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,

      },
      "& .react-datepicker__header": {
        // backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderRadius: "16px 16px 0 0",
      },
      "& .react-datepicker__day--selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        borderRadius: "50%",
      },
      "& .react-datepicker__day:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        borderRadius: "50%",
      },
    },
  };
};
