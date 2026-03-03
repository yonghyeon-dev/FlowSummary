"use client";

interface WeeklyChartProps {
  title: string;
  data: { week: string; count: number }[];
  color?: string;
}

export function WeeklyChart({ title, data, color = "bg-primary" }: WeeklyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {d.count > 0 ? d.count : ""}
            </span>
            <div
              className={`w-full rounded-t ${color} transition-all`}
              style={{
                height: `${(d.count / maxCount) * 100}%`,
                minHeight: d.count > 0 ? "4px" : "0px",
              }}
            />
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {d.week}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
