import { useLocation } from "react-router-dom";
import { privateRoutes } from "../routes/allRoutes";
import { useSelector } from "react-redux";

const useRouteName = () => {
  const location = useLocation();
  const { access_token } = useSelector((state) => state.authentication);

  const currentRoute = privateRoutes?.[0]?.children.find((route) => {
    const routeRegex = new RegExp(route.regex);
    return routeRegex.test(location.pathname);
  });

  if (location?.pathname === "/") {
    return access_token ? "Users" : "";
  } else {
    return currentRoute ? currentRoute.name : "Unknown Page";
  }
};

export default useRouteName;
