import "@fortawesome/fontawesome-free/css/all.min.css";
import { CssBaseline } from "@mui/material";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { Suspense, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import persistStore from "redux-persist/es/persistStore";

import MontyTheme from "./theme/MontyTheme";
import themesConfig from "./theme/themesConfig";
import { ToastContainer } from "react-toastify";
import AppRouter from "./core/routes/AppRouter";
import SuspenseLoading from "./Components/shared/suspense-loading/SuspenseLoading";
import { store } from "./Redux/store";
// import getTheme from "@themes/helpers/getTheme";

async function clearAllCaches() {
  // Clear IndexedDB
  if (window.indexedDB && indexedDB.databases) {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      await indexedDB.deleteDatabase(db.name);
    }
    console.log("IndexedDB cleared.");
  }

  // Clear Service Worker Cache
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log("Service Worker caches cleared.");
  }
}

function App() {
  const dispatch = useDispatch();
  const appVersion = __APP_VERSION__;
  const mode = useSelector((state) => state.theme?.mode);
  const theme =
    mode == "dark" ? themesConfig.defaultDark : themesConfig.default;

  useEffect(() => {
    const localPackageVersion = localStorage.getItem("PACKAGE_VERSION");

    if (!localPackageVersion) {
      localStorage.setItem("PACKAGE_VERSION", appVersion);
    } else {
      const persistor = persistStore(store);

      if (localPackageVersion !== appVersion) {
        persistor
          .purge()
          .then(() => {
            console.log("Redux Persist state purged.");
            localStorage.clear();
            sessionStorage.clear();
            clearAllCaches()
              .then(() => {
                console.log("All cache cleared due to version mismatch.");
              })
              .catch((error) => {
                console.error("Error clearing caches:", error);
              });
          })
          .catch((error) => {
            console.error("Error purging Redux Persist state:", error);
          });
      } else {
        console.log("Versions match. No action required");
      }
    }
  }, [localStorage.getItem("PACKAGE_VERSION")]);

  return (
    <MontyTheme theme={theme} direction="ltr">
      <CssBaseline />

      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <AppRouter />
        </div>

        <ToastContainer
          position="top-center"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          progressClassName="Toast__progress_bar"
          closeButton={false}
        />
      </BrowserRouter>
    </MontyTheme>
  );
}

export default App;
