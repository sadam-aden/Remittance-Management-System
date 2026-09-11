"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import type { DailyFlow } from "@/lib/repositories/dashboard-repository";

// Semantic accent colors are invariant across light/dark (see globals.css) —
// literal hex here matches the bg-income/bg-sent utility classes used elsewhere.
const INCOME = "#2FBF71";
const SENT = "#F0453A";

export function IncomeVsSentChart({ data }: { data: DailyFlow[] }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-text-primary">Income vs Sent</h2>
          <p className="mt-1 text-sm text-text-muted">This week, by day</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-income" /> Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-sent" /> Sent
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={6} maxBarSize={24}>
          <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
          <XAxis
            dataKey="day"
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
            width={40}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-hairline)", opacity: 0.3 }} />
          <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} />
          <Bar dataKey="sent" name="Sent" fill={SENT} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
