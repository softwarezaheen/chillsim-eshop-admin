import { Box, ClickAwayListener, Tooltip } from "@mui/material";
import { useState } from "react";

const TooltipComponent = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
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
        <Box className={"min-w-0"} onClick={() => handleToggleTooltip()}>
          {children}
        </Box>
      </Tooltip>
    </ClickAwayListener>
  );
};

export default TooltipComponent;
