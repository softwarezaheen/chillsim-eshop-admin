import { Skeleton } from "@mui/material";

export default function GroupTagSkeleton() {
  const chipWidths = [70, 90, 60, 80, 110];

  return (
    <div className="flex flex-wrap gap-2">
      {chipWidths.map(
        (
          width,
          index // NOSONAR
        ) => (
          <Skeleton
            key={index}
            variant="rounded"
            width={width}
            height={32}
            sx={{
              borderRadius: "16px",
            }}
          />
        )
      )}
    </div>
  );
}
