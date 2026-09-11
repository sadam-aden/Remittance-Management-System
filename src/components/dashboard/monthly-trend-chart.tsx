"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import type { MonthlyFlow } from "@/lib/repositories/dashboard-repository";

const INCOME = "#2FBF71";
const SENT = "#F0453A";

const RANGES = { "3M": 3, "6M": 6, "12M": 12 } as const;
type Range = keyof typeof RANGES;

export function MonthlyTrendChart({ data }: { data: MonthlyFlow[] }) {
  const [range, setRange] = useState<Range>("6M");
  const sliced = data.slice(-RANGES[range]);

  return (
    <div className="rounded-2xl border border-hairline bg-card p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-text-primary">Monthly Trend</h2>
          <p className="mt-1 text-sm text-text-muted">Income and sent volume</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-income" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-sent" /> Sent
            </span>
          </div>
          <div className="flex overflow-hidden rounded-full border border-hairline text-xs">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className="px-3 py-1.5"
                style={{
                  background: range === r ? "var(--color-report-dim)" : "transparent",
                  color: range === r ? "var(--color-report)" : "var(--color-text-muted)",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={sliced}>
          <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
          <XAxis
            dataKey="month"
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            stroke="var(--color-text-muted)"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={50}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-hairline)" }} />
          <Line type="monotone" dataKey="income" name="Income" stroke={INCOME} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="sent" name="Sent" stroke={SENT} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
