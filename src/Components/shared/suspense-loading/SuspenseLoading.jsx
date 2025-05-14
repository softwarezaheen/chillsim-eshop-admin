import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

const SuspenseLoading = () => {
  return (
    <div
      className={
        "bg-primary flex flex-col gap-[2rem] items-center justify-center h-screen w-full"
      }
    >
      <div>
        <LazyLoadImage
          className="animate-pulse"
          alt={import.meta.env.VITE_APP_PROJECT_TITLE || ""}
          height={300}
          src={"/logo/esimLoader.png"}
          width={200}
          loading="lazy"
        />
      </div>
      <h1 className={"text-white"}>Loading...please wait</h1>
    </div>
  );
};

export default SuspenseLoading;
