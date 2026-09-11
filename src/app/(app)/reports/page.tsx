import type { Metadata } from "next";
import { reportsRepository } from "@/lib/repositories/reports-repository";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { ledgerRepository } from "@/lib/repositories/ledger-repository";
import { parseReportFilters } from "@/lib/report-filter-params";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReportFilters } from "./report-filters";
import { ReportTable } from "./report-table";
import { ReportExportButtons } from "./report-export-buttons";

export const metadata: Metadata = { title: "Reports — Remittance Desk" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { filters, period, customFrom, customTo, sortValue } = parseReportFilters((key) => params[key]);

  const [rows, summary, customersResult, currentBalance] = await Promise.all([
    reportsRepository.getTransactions(filters),
    reportsRepository.getSummary(filters),
    customerRepository.list({ pageSize: 500 }),
    ledgerRepository.getCurrentBalance(),
  ]);

  const queryString = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]),
  ).toString();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">Reports</h2>
          <p className="text-sm text-text-muted">
            {filters.dateFrom.toLocaleDateString("en-US")} – {filters.dateTo.toLocaleDateString("en-US")}
          </p>
        </div>
        <ReportExportButtons queryString={queryString} />
      </div>

      <ReportFilters
        customers={customersResult.items.map((c) => ({ id: c.id, fullName: c.fullName }))}
        period={period}
        customFrom={customFrom}
        customTo={customTo}
        customerId={filters.customerId}
        type={filters.type}
        sort={sortValue}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          label="Current Balance"
          value={`$${currentBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tone="report"
        />
        <StatCard
          label="Total Income"
          value={`$${summary.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tone="income"
        />
        <StatCard
          label="Total Sent"
          value={`$${summary.totalSent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tone="sent"
        />
        <StatCard
          label="Total Profit"
          value={`$${summary.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          tone="report"
        />
        <StatCard
          label="Transactions"
          value={summary.transactionCount.toLocaleString()}
          tone="report"
        />
      </div>

      <ReportTable rows={rows} />
    </div>
  );
}
