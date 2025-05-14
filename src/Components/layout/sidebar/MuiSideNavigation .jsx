import {
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import {
  Box,
  ClickAwayListener,
  Drawer,
  Grid2,
  IconButton,
  List,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import montymobileimage from "../../../assets/monty-mobile-icon.svg";
import { closedMixin, openedMixin } from "./MenuFunctions";
import MenuItems from "./MenuItems";
import MuiDrawerHeader from "./MuiDrawerHeader";
import ToolTipMenu from "./ToolTipMenu";
import { INDEX_ROUTE, MenuRoutes } from "../../../core/routes/RouteVariables";
const MuiSideNavigation = ({ open, drawerWidth, setOpen }) => {
  const theme = useTheme();

  const isSmall = useMediaQuery("(max-width: 1024px)");
  const location = useLocation();
  const pathName = location.pathname;
  const [openMenus, setOpenMenus] = useState(() => {
    const savedMenus = localStorage.getItem("openMenus");
    return savedMenus ? JSON.parse(savedMenus) : {};
  });

  const toggleMenu = useCallback((guid) => {
    setOpenMenus((prev) => {
      const newOpenMenus = {};
      if (!prev[guid]) {
        newOpenMenus[guid] = true;
      }
      localStorage.setItem("openMenus", JSON.stringify(newOpenMenus));
      return newOpenMenus;
    });
  }, []);

  const getStyles = (level) => ({
    padding: `${6 - level * 5}px 14px !important`,
    fontSize: `${14 - parseInt(level) * 1}px !important`,
    borderRadius: "0px",
  });
  const IsActive = (item) => {
    if (pathName === "/" && item?.uri === "users") return true;
    return (
      pathName.includes(`/${item?.uri}`) ||
      item?.children?.some((child) => pathName.includes(`/${child?.uri}`))
    );
  };

  const renderMenu = (items, level = 0) =>
    items?.map((item, index) => {
      const hasChildren = item?.children?.length > 0;
      const isClickable = !hasChildren;
      if (!open && hasChildren) {
        return <ToolTipMenu key={index} item={item} IsActive={IsActive} />;
      }
      return (
        <MenuItems
          key={index}
          item={item}
          level={level}
          hasChildren={hasChildren}
          toggleMenu={toggleMenu}
          isClickable={isClickable}
          IsActive={IsActive}
          getStyles={getStyles}
          open={open}
          openMenus={openMenus}
          renderMenu={renderMenu}
        />
      );
    });
  const handleDrawerClose = (_, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      setOpen(false);
    }
  };

  return (
    <Drawer
      variant={isSmall ? "temporary" : "permanent"}
      open={open}
      onClose={handleDrawerClose}
      sx={(theme) => ({
        width: "250px",
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        ...(open ? openedMixin(theme) : closedMixin(theme)),
        "& .MuiDrawer-paper": open ? openedMixin(theme) : closedMixin(theme),
      })}
    >
      <MuiDrawerHeader>
        {open ? (
          <div
            className={
              "flex flex-row justify-between gap-[0.5rem] items-center w-full"
            }
          >
            <Link to={INDEX_ROUTE}>
              <img alt="Monty Mobile" src={montymobileimage} width={85} />{" "}
            </Link>

            <IconButton
              onClick={() => {
                setOpen((prev) => !prev);
                localStorage.setItem("MenuOpen", !open);
              }}
            >
              <KeyboardDoubleArrowLeft fontSize="medium" color="primary" />{" "}
            </IconButton>
          </div>
        ) : (
          <IconButton
            onClick={() => {
              setOpen((prev) => !prev);
              localStorage.setItem("MenuOpen", !open);
            }}
          >
            <KeyboardDoubleArrowRight fontSize="medium" color="primary" />{" "}
          </IconButton>
        )}{" "}
      </MuiDrawerHeader>{" "}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {MenuRoutes.length > 0 && <List>{renderMenu(MenuRoutes)}</List>}{" "}
      </Box>{" "}
    </Drawer>
  );
};
export default MuiSideNavigation;
