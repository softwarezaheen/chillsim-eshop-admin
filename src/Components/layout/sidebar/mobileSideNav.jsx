import {
  ExpandLess,
  ExpandMore,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import montymobileimage from "../../../../assets/monty-mobile-icon.svg";
// import montymobileimage from "../../../Assets/Images/monty-mobile-icon.svg";

import { Link } from "react-router-dom";
// import Footer from "./Footer";
import MuiDrawerHeader from "./MuiDrawerHeader";
import { truncateText } from "../../../../core/helpers/utilFunctions";
import { INDEX_ROUTE } from "../../../core/routes/RouteVariables";

const MobileMuiSideNavigation = ({ open, drawerWidth, setOpen }) => {
  const pages = useSelector((state) => state?.userMenus);

  const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: "ease-in-out",
      duration: theme.transitions.duration.enteringScreen * 2,
    }),
    overflowX: "hidden",
    scrollbarWidth: "thin",
  });

  const closedMixin = (theme) => ({
    transition: theme.transitions.create("width", {
      easing: "ease-in-out",
      duration: theme.transitions.duration.leavingScreen * 2,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
      width: `calc(${theme.spacing(11)} + 1px)`,
    },
  });

  const MuiDrawer = styled(Drawer, {
    shouldForwardProp: (prop) => prop !== "open",
  })(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
      ...openedMixin(theme),
      "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      "& .MuiDrawer-paper": closedMixin(theme),
    }),
  }));

  const MenuList = ({ open }) => {
    const [menuHierarchy, setMenuHierarchy] = useState([]);
    const [openMenus, setOpenMenus] = useState(() => {
      // Load the saved state from localStorage or default to an empty object
      const savedMenus = localStorage.getItem("openMenus");
      return savedMenus ? JSON.parse(savedMenus) : {};
    });
    const [openChildMenu, setOpenChildMenu] = useState(0);
    const activePages = useSelector(
      (state) => state?.sideNav?.allSelectedTabs ?? []
    );

    const dispatch = useDispatch();

    useEffect(() => {
      const openActiveMenus = () => {
        if (activePages.length > 0) {
          const newOpenMenus = {};
          const findParentGuids = (recordGuid, hierarchy) => {
            for (const item of hierarchy) {
              if (item.recordGuid === recordGuid) {
                return [item.recordGuid];
              }
              if (item.children.length > 0) {
                const foundParents = findParentGuids(recordGuid, item.children);
                if (foundParents.length > 0) {
                  return [item.recordGuid, ...foundParents];
                }
              }
            }
            return [];
          };

          activePages.forEach((activePage) => {
            const parentGuids = findParentGuids(activePage, menuHierarchy);
            parentGuids.forEach((guid) => {
              newOpenMenus[guid] = true;
            });
          });

          setOpenMenus(newOpenMenus);
        }
      };

      openActiveMenus();
    }, [activePages, menuHierarchy]);

    useEffect(() => {
      const buildHierarchy = () => {
        const menuMap = {};
        const orphanItems = [];
        let sortedData = [...pages].sort(
          (a, b) => a?.displayOrder - b?.displayOrder
        );

        if (sortedData.length > 1) {
          sortedData = sortedData.filter((page) => page.parentGuid !== null);
        }

        sortedData.forEach((page) => {
          menuMap[page.recordGuid] = { ...page, children: [] };
        });

        const rootMenus = [];
        sortedData.forEach((page) => {
          if (page.parentGuid) {
            if (menuMap[page.parentGuid]) {
              menuMap[page.parentGuid].children.push(menuMap[page.recordGuid]);
            } else {
              orphanItems.push(menuMap[page.recordGuid]);
            }
          } else {
            rootMenus.push(menuMap[page.recordGuid]);
          }
        });

        return [...rootMenus, ...orphanItems];
      };

      setMenuHierarchy(buildHierarchy());
    }, []);

    const toggleMenu = (guid, level, parentGuid = null) => {
      setOpenMenus((prev) => {
        const newOpenMenus = { ...prev };

        if (level === 0) {
          Object.keys(newOpenMenus).forEach((key) => {
            if (menuHierarchy.some((parent) => parent.recordGuid === key)) {
              delete newOpenMenus[key];
            }
          });
          newOpenMenus[guid] = !prev[guid];
        }

        if (level === 1 && parentGuid) {
          // Keep the parent open
          newOpenMenus[parentGuid] = true;

          Object.keys(newOpenMenus).forEach((key) => {
            if (
              menuHierarchy.some((parent) =>
                parent.children.some((child) => child.recordGuid === key)
              )
            ) {
              delete newOpenMenus[key];
            }
          });
          newOpenMenus[guid] = !prev[guid];
        }

        if (level === 2 && parentGuid) {
          const grandParentGuid = menuHierarchy.find((parent) =>
            parent.children.some((child) => child.recordGuid === parentGuid)
          )?.recordGuid;

          if (grandParentGuid) {
            newOpenMenus[grandParentGuid] = true;
          }
          newOpenMenus[parentGuid] = true;
          newOpenMenus[guid] = !prev[guid];
        }

        localStorage.setItem("openMenus", JSON.stringify(newOpenMenus));

        return newOpenMenus;
      });
    };

    useEffect(() => {
      const savedMenus = localStorage.getItem("openMenus");
      if (savedMenus) {
        setOpenMenus(JSON.parse(savedMenus));
      }
    }, []);

    const getStyles = (level) => {
      switch (level) {
        case 0:
          return {
            fontSize: open ? "14px" : "18px",
            padding: open ? "6px 14px !important" : "10px 16px !important",

            borderRadius: "50px",
          };
        case 1:
          return {
            fontSize: "13px",
            padding: "4px 14px !important",
            borderRadius: "50px",
          };
        case 2:
          return {
            fontSize: "12px",
            padding: "2px 14px !important",
            borderRadius: "50px",
          };
        default:
          return {
            fontSize: "12px",
            padding: "2px 0px !important",
            borderRadius: "50px",
          };
      }
    };

    const getAllAncestorGuids = (guid, hierarchy) => {
      const result = [];
      const findAncestors = (guid, hierarchy) => {
        for (const item of hierarchy) {
          if (item.recordGuid === guid) {
            result.unshift(item.recordGuid);
            return true;
          }
          if (item.children.length > 0 && findAncestors(guid, item.children)) {
            result.unshift(item.recordGuid);
            return true;
          }
        }
        return false;
      };

      findAncestors(guid, hierarchy);

      return result;
    };

    const handleMouseEnter = (index) => {
      setOpenChildMenu(index);
      localStorage.setItem("openChildMenu", index);
    };

    const handleMouseLeave = () => {
      setOpenChildMenu(null);
      localStorage.removeItem("openChildMenu");
    };

    const renderMenu = (items, level = 0) => {
      return items.map((item) => {
        const isClickable = item.children.length === 0;

        if (!open && level === 0) {
          if (item.children.length === 0) {
            return (
              <ListItemButton
                key={item.recordGuid}
                to={`/${item.uri}`}
                component={Link}
                onClick={() => {
                  setOpen((prev) => !prev);
                  localStorage.setItem("MenuOpen", !open);
                }}
                sx={{
                  color: activePages.includes(item.recordGuid)
                    ? "white"
                    : "black",
                  backgroundColor: activePages.includes(item.recordGuid)
                    ? "var(--primary-color)"
                    : "",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "var(--primary-color)",
                  },
                  ...getStyles(0),
                  marginBottom: "1px",
                }}
              >
                <i className={`fa ${item.iconUri} menu-icon px-3`} />
              </ListItemButton>
            );
          }

          return (
            <Tooltip
              key={item.recordGuid}
              title={
                <Box>
                  {item.children.map((child, childIndex) => (
                    <Box
                      key={child.recordGuid}
                      onMouseEnter={() => handleMouseEnter(childIndex)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <ListItemButton
                        to={`/${child.uri}`}
                        onClick={() => {
                          setOpen((prev) => !prev);
                          localStorage.setItem("MenuOpen", !open);
                        }}
                        component={Link}
                        sx={{
                          color: activePages.includes(child.recordGuid)
                            ? "white"
                            : "black",
                          backgroundColor: activePages.includes(
                            child.recordGuid
                          )
                            ? "var(--primary-color)"
                            : "",
                          "&:hover": {
                            color: "white",
                            backgroundColor: "var(--primary-color)",
                          },
                          ...getStyles(1),
                          marginBottom: "1px",
                        }}
                      >
                        <i className={`fa ${child.iconUri} menu-icon`} />
                        <ListItemText
                          className={`px-3`}
                          primary={truncateText(child.menuDetail[0]?.name, 20)}
                          primaryTypographyProps={{
                            fontSize: getStyles(1).fontSize,
                          }}
                        />
                        {child.children.length > 0 &&
                          (openMenus[child.recordGuid] ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          ))}
                      </ListItemButton>
                      {child.children.length > 0 && (
                        <Collapse
                          in={openChildMenu === childIndex}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ pl: 4 }}>
                            {child.children.map((subchild) => (
                              <ListItemButton
                                key={subchild.recordGuid}
                                to={`/${subchild.uri}`}
                                component={Link}
                                onClick={() => {
                                  setOpen((prev) => !prev);
                                  localStorage.setItem("MenuOpen", !open);
                                }}
                                sx={{
                                  color: activePages.includes(
                                    subchild.recordGuid
                                  )
                                    ? "white"
                                    : "black",
                                  backgroundColor: activePages.includes(
                                    subchild.recordGuid
                                  )
                                    ? "var(--primary-color)"
                                    : "",
                                  "&:hover": {
                                    color: "white",
                                    backgroundColor: "var(--primary-color)",
                                  },
                                  ...getStyles(2),
                                  marginBottom: "1px",
                                }}
                              >
                                <i
                                  className={`fa ${subchild.iconUri} menu-icon`}
                                />
                                <ListItemText
                                  className={`px-3`}
                                  primary={truncateText(
                                    subchild.menuDetail[0]?.name,
                                    20
                                  )}
                                  primaryTypographyProps={{
                                    fontSize: getStyles(2).fontSize,
                                  }}
                                />
                              </ListItemButton>
                            ))}
                          </Box>
                        </Collapse>
                      )}
                    </Box>
                  ))}
                </Box>
              }
              placement="right-start"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    color: "#514E6A",
                    backgroundColor: "white",
                  },
                },
                arrow: {
                  sx: {
                    "&::before": {
                      color: "#002d57",
                    },
                  },
                },
              }}
              sx={{
                "& .MuiTooltip-tooltip": {
                  backgroundColor: "white",
                  color: "black",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px",
                },
              }}
            >
              <div>
                <ListItemButton
                  sx={{
                    color: activePages.includes(item.recordGuid)
                      ? "white"
                      : "black",
                    backgroundColor: activePages.includes(item.recordGuid)
                      ? "var(--primary-color)"
                      : "",
                    "&:hover": {
                      color: "white",
                      backgroundColor: "var(--primary-color)",
                    },
                    ...getStyles(0),
                    marginBottom: "1px",
                  }}
                >
                  <i className={`fa ${item.iconUri} menu-icon px-3`} />
                </ListItemButton>
              </div>
            </Tooltip>
          );
        }

        return (
          <div
            key={item.recordGuid}
            style={{
              marginLeft:
                level === 1 ? level * 28 : level === 2 ? level * 14 : null,
            }}
          >
            <ListItemButton
              onClick={
                isClickable
                  ? () => {
                      level === 0 && localStorage.removeItem("openMenus");
                      setOpen((prev) => !prev);
                      localStorage.setItem("MenuOpen", !open);
                    }
                  : () =>
                      toggleMenu(
                        item.recordGuid,
                        level,
                        level === 0 ? null : item.parentGuid
                      )
              }
              to={isClickable ? `/${item.uri}` : undefined}
              key={isClickable ? item.uri : undefined}
              component={isClickable ? Link : undefined}
              sx={{
                color: activePages.includes(item.recordGuid)
                  ? "white"
                  : "black",
                backgroundColor: activePages.includes(item.recordGuid)
                  ? "var(--primary-color)"
                  : "",

                "&:hover": {
                  color: "white",
                  backgroundColor: "var(--primary-color)",
                },
                ...getStyles(level),
                marginBottom: "1px",
              }}
            >
              {level !== 2 && (
                <i
                  className={`fa ${item.iconUri} menu-icon `}
                  style={{ fontSize: "12px" }}
                />
              )}

              <ListItemText
                className={`px-3`}
                primary={truncateText(item.menuDetail[0]?.name, 20)}
                primaryTypographyProps={{
                  fontSize: getStyles(level).fontSize,
                }}
              />
              {item.children.length > 0 &&
                (openMenus[item.recordGuid] ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            {item.children.length > 0 && (
              <Collapse
                in={openMenus[item.recordGuid]}
                timeout="auto"
                unmountOnExit
              >
                <Box sx={{ position: "relative" }}>
                  <Divider
                    orientation="vertical"
                    style={{
                      position: "absolute",
                      left: "20px",
                      width: "3px",
                      backgroundColor: "var(--primary-color)",
                    }}
                  />
                  {renderMenu(item.children, level + 1)}
                </Box>
              </Collapse>
            )}
          </div>
        );
      });
    };

    return (
      <List
        sx={{
          paddingTop: 0,
          paddingBottom: 0,
          position: "relative",
          height: "100%",
        }}
      >
        {renderMenu(menuHierarchy)}
      </List>
    );
  };

  return (
    <>
      {open ? (
        <MuiDrawer
          disableRestoreFocus
          style={{
            zIndex: 1000,
            height: open ? "100vh" : "5vh",
            display: "flex",
            flexDirection: "column",
          }}
          variant="permanent"
          open={open}
          id="Navigation"
          className={`${open && "opened"}`}
        >
          <MuiDrawerHeader>
            {open ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <a href={INDEX_ROUTE}>
                  <img alt="Monty Mobile" src={montymobileimage} width={85} />
                </a>
                <Box
                  onClick={() => {
                    setOpen((prev) => !prev);
                    localStorage.setItem("MenuOpen", !open);
                  }}
                >
                  <KeyboardDoubleArrowLeft
                    sx={{
                      fontSize: "25px",
                      color: "var(--primary-color)",
                      marginRight: "5px",
                      "&:hover": {
                        cursor: "pointer",
                        backgroundColor: "var(--primary-color)",
                        color: "white",
                        borderRadius: "50px",
                      },
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => {
                  setOpen((prev) => !prev);
                  localStorage.setItem("MenuOpen", !open);
                }}
              >
                <KeyboardDoubleArrowRight
                  sx={{
                    fontSize: "25px",
                    color: "var(--primary-color)",
                    "&:hover": {
                      cursor: "pointer",
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                      borderRadius: "50px",
                    },
                  }}
                />
              </Box>
            )}
          </MuiDrawerHeader>

          <Box sx={{ flexGrow: 1, overflow: "auto" }}>
            {pages?.length > 0 && <MenuList open={open} />}
          </Box>

          {/* Footer */}
          {/* <Footer open={open} /> */}
        </MuiDrawer>
      ) : (
        <Box
          disableRestoreFocus
          style={{
            zIndex: 1000,
            height: open ? "100vh" : "5vh",
            display: "flex",
            flexDirection: "column",
          }}
          variant="permanent"
          open={open}
          id="Navigation"
          className={`${open && "opened"}`}
        >
          <MuiDrawerHeader>
            {open ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <a href={INDEX_ROUTE}>
                  <img alt="Monty Mobile" src={montymobileimage} width={85} />
                </a>
                <Box
                  onClick={() => {
                    setOpen((prev) => !prev);
                    localStorage.setItem("MenuOpen", !open);
                  }}
                >
                  <KeyboardDoubleArrowLeft
                    sx={{
                      fontSize: "25px",
                      color: "var(--primary-color)",
                      marginRight: "5px",
                      "&:hover": {
                        cursor: "pointer",
                        backgroundColor: "var(--primary-color)",
                        color: "white",
                        borderRadius: "50px",
                      },
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => {
                  setOpen((prev) => !prev);
                  localStorage.setItem("MenuOpen", !open);
                }}
              >
                <KeyboardDoubleArrowRight
                  sx={{
                    fontSize: "25px",
                    color: "var(--primary-color)",
                    "&:hover": {
                      cursor: "pointer",
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                      borderRadius: "50px",
                    },
                  }}
                />
              </Box>
            )}
          </MuiDrawerHeader>

          {/* Footer */}
          {/* <Footer open={open} /> */}
        </Box>
      )}
    </>
  );
};
export default MobileMuiSideNavigation;
