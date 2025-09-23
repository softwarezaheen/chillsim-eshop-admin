import React from "react";
import { Route, Routes } from "react-router-dom";
import { privateRoutes, publicRoutes } from "./allRoutes";

const AppRouter = () => {
  return (
    <Routes>
      {privateRoutes?.map((route, i) =>
        route?.children ? (
          <Route key={route.path || i} path={route.path} element={route.element}>
            {route.children.map((child, j) => (
              <Route
                index={child?.index}
                key={child.path ? `${child.path}-${j}` : j}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ) : (
          <Route
            key={route.path || i}
            index={route?.index}
            element={route?.element}
          />
        )
      )}

      {publicRoutes?.map((route, i) =>
        route?.children ? (
          <Route key={route.path || i} path={route.path} element={route.element}>
            {route.children.map((child, j) => (
              <Route
                index={child?.index}
                key={child.path ? `${child.path}-${j}` : j}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ) : (
          <Route
            key={route.path || i}
            index={route?.index}
            element={route?.element}
          />
        )
      )}
    </Routes>
  );
};

export default AppRouter;
