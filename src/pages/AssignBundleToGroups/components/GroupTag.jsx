import React from "react";
import { Chip, Avatar } from "@mui/material";
import { useAssignBundleContext } from "../hooks/AssignBundleContext";

export default function GroupTag({ tag }) {
  const { removeTag, isTagSelected, selectTag } = useAssignBundleContext();

  const handleClick = () => {
    if (isTagSelected(tag?.id)) {
      removeTag(tag?.id);
    } else {
      selectTag(tag?.id);
    }
  };

  return (
    <>
      <Chip
        avatar={
          tag?.icon && (
            <Avatar
              src={tag?.icon}
              alt={tag?.name}
              sx={{ width: 24, height: 24 }}
            />
          )
        }
        label={tag?.name}
        variant="outlined"
        onClick={handleClick}
        sx={{
          borderColor: isTagSelected(tag?.id)
            ? "var(--color-secondary)"
            : "var(--border-shade-700)",
          color: isTagSelected(tag?.id) ? "var(--color-secondary)" : "inherit",
          backgroundColor: isTagSelected(tag?.id)
            ? "var(--color-secondary-50)"
            : "transparent",
          fontWeight: isTagSelected(tag?.id) ? 600 : 400,
          borderWidth: "2px",
          fontSize: "0.875rem",
        }}
      />
    </>
  );
}
