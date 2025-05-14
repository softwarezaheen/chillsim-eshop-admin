import { FormHelperText, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";
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
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Grid
      item
      xs={12}
      sm={6}
      className={
        error
          ? "date-picker-error"
          : isDarkMode
          ? "date-picker-dark"
          : "date-picker-light"
      }
    >
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
