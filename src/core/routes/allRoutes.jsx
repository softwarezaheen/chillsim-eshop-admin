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
import VouchersList from "../../pages/vouchers/VouchersList";
import Partners from "../../pages/partners/Partners";
import PromotionsPage from "../../pages/promotions/PromotionsPage";

// App Content Pages
import FAQPage from "../../pages/app-content/FAQPage";
import TermsAndConditionsPage from "../../pages/app-content/TermsAndConditionsPage";
import PrivacyPolicyPage from "../../pages/app-content/PrivacyPolicyPage";
import AboutUsPage from "../../pages/app-content/AboutUsPage";
import CookiePolicyPage from "../../pages/app-content/CookiePolicyPage";

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
        path: "/partners",
        element: <Partners />,
        key: "/partners",
        name: "Partners",
        regex: "^/partners/?$",
      },
      {
        path: "/vouchers",
        element: <VouchersList />,
        key: "/vouchers",
        name: "Vouchers",
        regex: "^/vouchers/?$",
      },
      {
        path: "/promotions",
        element: <PromotionsPage />,
        key: "/promotions",
        name: "Promotions",
        regex: "^/promotions/?$",
      },
      // App Content Routes
      {
        path: "/app-content",
        element: <FAQPage />,
        key: "/app-content",
        name: "App Content",
        regex: "^/app-content/?$",
      },
      {
        path: "/app-content/faq",
        element: <FAQPage />,
        key: "/app-content/faq",
        name: "FAQ",
        regex: "^/app-content/faq/?$",
      },
      {
        path: "/app-content/terms-and-conditions",
        element: <TermsAndConditionsPage />,
        key: "/app-content/terms-and-conditions",
        name: "Terms and Conditions",
        regex: "^/app-content/terms-and-conditions/?$",
      },
      {
        path: "/app-content/privacy-policy",
        element: <PrivacyPolicyPage />,
        key: "/app-content/privacy-policy",
        name: "Privacy Policy",
        regex: "^/app-content/privacy-policy/?$",
      },
      {
        path: "/app-content/about-us",
        element: <AboutUsPage />,
        key: "/app-content/about-us",
        name: "About Us",
        regex: "^/app-content/about-us/?$",
      },
      {
        path: "/app-content/cookie-policy",
        element: <CookiePolicyPage />,
        key: "/app-content/cookie-policy",
        name: "Cookie Policy",
        regex: "^/app-content/cookie-policy/?$",
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
