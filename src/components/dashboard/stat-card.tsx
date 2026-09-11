export function StatCard({
  label,
  value,
  delta,
  positive,
  tone,
  big,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  tone: "income" | "sent" | "report";
  big?: boolean;
}) {
  const toneBg = tone === "income" ? "bg-income" : tone === "sent" ? "bg-sent" : "bg-report";

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border border-hairline bg-card p-5 ${big ? "col-span-2" : ""}`}
    >
      <span className="text-[13px] text-text-muted">{label}</span>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span
          className={`font-display font-semibold leading-none text-text-primary ${big ? "text-[38px]" : "text-[26px]"}`}
        >
          {value}
        </span>
        {delta && (
          <span
            className={`mb-1 flex shrink-0 items-center gap-1 text-xs ${positive ? "text-income" : "text-sent"}`}
          >
            {positive ? "▲" : "▼"} {delta}
          </span>
        )}
      </div>
      <div className="mt-4 h-[3px] w-full rounded-full bg-hairline">
        <div className={`h-[3px] w-[58%] rounded-full ${toneBg}`} />
      </div>
    </div>
  );
}
