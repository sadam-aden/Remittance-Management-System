interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
}

/**
 * Custom Recharts tooltip content, per dataviz skill spec: value leads (bold,
 * text-primary ink), series name is secondary/muted, series identity comes
 * from a short line-key (a stroke swatch) rather than a filled box, and every
 * series at that X is listed together rather than gating on hovering a mark.
 */
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-hairline bg-panel px-3 py-2">
      {label && <p className="mb-1.5 text-xs text-text-muted">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center gap-2 text-xs">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: entry.color }} />
            <span className="text-text-muted">{entry.name}</span>
            <span className="ml-auto font-display font-semibold text-text-primary">
              $
              {Number(entry.value ?? 0).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
