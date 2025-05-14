import { ClickAwayListener, Tooltip } from "@mui/material";
import React, { useState } from "react";

const TooltipComponent = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };
  const handleToggleTooltip = () => {
    setOpen(!open);
  };

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip
        disableFocusListener
        disableHoverListener
        arrow
        open={open}
        title={title}
        slotProps={{
          popper: {
            disablePortal: true,
            sx: { marginTop: "0px !important" },
          },
        }}
      >
        <div className={"min-w-0"} onClick={() => handleToggleTooltip()}>
          {children}
        </div>
      </Tooltip>
    </ClickAwayListener>
  );
};

export default TooltipComponent;
