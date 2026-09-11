"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_PERIODS, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/report-periods";
import { SortSelect } from "@/components/shell/sort-select";
import type { SortValue } from "@/lib/sort-params";

export interface ReportFilterCustomerOption {
  id: string;
  fullName: string;
}

export function ReportFilters({
  customers,
  period,
  customFrom,
  customTo,
  customerId,
  type,
  sort,
}: {
  customers: ReportFilterCustomerOption[];
  period: ReportPeriod;
  customFrom?: string;
  customTo?: string;
  customerId?: string;
  type?: string;
  sort?: SortValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={period} onValueChange={(v) => v && updateParam("period", v)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPORT_PERIODS.map((p) => (
            <SelectItem key={p} value={p}>
              {REPORT_PERIOD_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "custom" && (
        <>
          <Input
            type="date"
            className="w-40"
            defaultValue={customFrom}
            onChange={(e) => updateParam("from", e.target.value)}
          />
          <Input
            type="date"
            className="w-40"
            defaultValue={customTo}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </>
      )}

      <Select
        value={customerId ?? "all"}
        onValueChange={(v) => updateParam("customerId", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All customers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All customers</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type ?? "all"} onValueChange={(v) => updateParam("type", v === "all" ? null : v)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Income + Sent</SelectItem>
          <SelectItem value="income">Income only</SelectItem>
          <SelectItem value="sent">Sent only</SelectItem>
        </SelectContent>
      </Select>

      <SortSelect initialSort={sort} />
    </div>
  );
}
