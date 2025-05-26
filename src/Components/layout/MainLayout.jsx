import { CssBaseline } from "@mui/material";
import TopNav from "./TopNav";

const MainLayout = ({ children }) => {
  return (
    <>
      <CssBaseline />
      <TopNav />
      <div className="flex-grow w-[90%] max-w-xxl mx-auto py-8">{children}</div>
    </>
  );
};

export default MainLayout;
