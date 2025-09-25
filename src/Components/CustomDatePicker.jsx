import { FormHelperText, Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.scss";

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  dateFormat = "dd/MM/yyyy",
  error = null,
  disabled = false,
  minDate = null,
  maxDate = null,
  label = null,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  let className;

  if (error) {
    className = "date-picker-error";
  } else if (isDarkMode) {
    className = "date-picker-dark";
  } else {
    className = "date-picker-light";
  }

  return (
    <Grid item xs={12} sm={6} className={className}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
      <DatePicker
        selected={value}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholder}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        className={` ${isDarkMode ? "theme-dark" : ""}`}
      />

      {error && (
        <FormHelperText className="helper-text">{error}</FormHelperText>
      )}
    </Grid>
  );
}
