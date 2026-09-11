"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { TopCustomerSlice } from "@/lib/repositories/dashboard-repository";

// income, report, sent, amber, neutral-gray ("Others" — intentionally
// desaturated, see dataviz skill notes on the Others bucket).
const COLORS = ["#2FBF71", "#3E8EF7", "#F0453A", "#E8B93E", "#3A4550"];

export function TopCustomersChart({
  slices,
  customerCount,
}: {
  slices: TopCustomerSlice[];
  customerCount: number;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-hairline bg-card p-6">
      <h2 className="font-display font-semibold text-text-primary">Top Customers</h2>
      <p className="mt-1 text-sm text-text-muted">Share of income volume</p>
      <div className="relative flex flex-1 items-center justify-center">
        {slices.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-muted">No completed income yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((s, i) => (
                    <Cell key={s.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute flex flex-col items-center">
              <span className="font-display text-[22px] font-bold text-text-primary">
                {customerCount}
              </span>
              <span className="text-xs text-text-muted">customers</span>
            </div>
          </>
        )}
      </div>
      {slices.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {slices.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-text-muted">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {s.name}
              </span>
              <span className="text-text-primary">{s.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
