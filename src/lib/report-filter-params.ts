import { getPeriodRange, isReportPeriod, type ReportPeriod } from "@/lib/report-periods";
import { parseSort, type SortValue } from "@/lib/sort-params";
import type { ReportFilters } from "@/lib/repositories/reports-repository";

/** Shared by the Reports page (Next.js searchParams) and the export Route Handlers (URLSearchParams) so filters always match what's on screen. */
export function parseReportFilters(get: (key: string) => string | undefined): {
  filters: ReportFilters;
  period: ReportPeriod;
  customFrom?: string;
  customTo?: string;
  sortValue: SortValue;
} {
  const periodParam = get("period");
  const period = isReportPeriod(periodParam) ? periodParam : "month";
  const customFrom = get("from");
  const customTo = get("to");
  const { from, to } = getPeriodRange(period, customFrom, customTo);
  const customerId = get("customerId") || undefined;
  const typeParam = get("type");
  const type = typeParam === "income" || typeParam === "sent" ? typeParam : undefined;
  const { sortBy, sortDir, sortValue } = parseSort(get("sort"));

  return {
    filters: { dateFrom: from, dateTo: to, customerId, type, sortBy, sortDir },
    period,
    customFrom,
    customTo,
    sortValue,
  };
}
