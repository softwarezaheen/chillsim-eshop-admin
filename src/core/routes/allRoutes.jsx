//COMPONENTS
import PageNotFound from "../../Components/shared/fallbacks/page-not-found/PageNotFound";
import SignInPage from "../../pages/authentication/SignInPage";
import BundlesList from "../../pages/bundles/BundlesList";
import ContactusPage from "../../pages/contact-us/ContactusPage";
import DevicesPage from "../../pages/devices/DevicesPage";
import OrdersPage from "../../pages/orders/OrdersPage";
import UserDetail from "../../pages/users/UserDetail";
import UsersPage from "../../pages/users/UsersPage";
import RouteWrapper from "./RouteWrapper";
import ChangePasswordPage from "../../pages/authentication/ChangePasswordPage";

export const privateRoutes = [
  {
    path: "/",
    element: <RouteWrapper shouldbeLoggedIn={true} />,
    key: "/users",
    name: "Users",
    regex: "^/users/?$",
    children: [
      {
        index: true,
        element: <UsersPage />,
        key: "/users",
        name: "Users",
        regex: "^/users/?$",
      },
      {
        path: "/users",
        element: <UsersPage />,
        key: "/users",
        name: "Users",
        regex: "^/users/?$",
      },
      {
        path: "/devices",
        element: <DevicesPage />,
        key: "/users",
        name: "Devices",
        regex: "^/devices/?$",
      },
      {
        path: "/orders",
        element: <OrdersPage />,
        key: "/orders",
        name: "Orders",
        regex: "^/orders/?$",
      },
      {
        path: "/users/:id",
        element: <UserDetail />,
        key: "/users/:id",
        name: "User Detail",
        regex: "^/users/([0-9a-fA-F-]+)$",
      },
      {
        path: "/contact-us",
        element: <ContactusPage />,
        key: "/contact-us",
        name: "Contact Us",
        regex: "^/contact-us/?$",
      },
      {
        path: "/bundles",
        element: <BundlesList />,
        key: "/bundles",
        name: "Bundles",
        regex: "^/bundles/?$",
      },
      {
        path: "/change-password",
        element: <ChangePasswordPage />,
        key: "/change-password",
        name: "Change Password",
        regex: "^/change-password/?$",
      },
      {
        path: "*",
        element: <PageNotFound />,
        key: "/bundles",
        name: "Bundles",
        regex: "^/bundles/?$",
      },
    ],
  },
];

export const publicRoutes = [
  {
    path: "/",
    element: <RouteWrapper shouldbeLoggedIn={false} />,
    key: "/",
    name: "Signin",
    regex: "^/signin/?$",
    children: [
      {
        index: true,
        element: <SignInPage />,
      },
      {
        path: "/signin",
        element: <SignInPage />,
        regex: "^/signin/?$",
      },
      {
        path: "*",
        element: <PageNotFound />,
      },
    ],
  },
];
