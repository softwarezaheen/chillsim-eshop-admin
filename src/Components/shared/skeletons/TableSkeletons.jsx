import { Skeleton } from "@mui/material";
import React from "react";

const TableSkeletons = ({ count }) => {
  return (
    <div className={"flex flex-col gap-[0.3rem]"}>
      {Array(count)
        .fill()
        ?.map((_, index) => (
          <Skeleton key={index} />
        ))}
    </div>
  );
};

export default TableSkeletons;
