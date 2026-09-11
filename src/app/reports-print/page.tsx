import { requireSession } from "@/lib/auth-helpers";
import { reportsRepository } from "@/lib/repositories/reports-repository";
import { ledgerRepository } from "@/lib/repositories/ledger-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { getClientIp } from "@/lib/get-client-ip";
import { parseReportFilters } from "@/lib/report-filter-params";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { formatMoney } from "@/lib/currency-format";
import { PrintTrigger } from "./print-trigger";

export default async function ReportsPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const { filters } = parseReportFilters((key) => params[key]);

  const [rows, summary, settings, currentBalance] = await Promise.all([
    reportsRepository.getTransactions(filters),
    reportsRepository.getSummary(filters),
    settingsRepository.get(),
    ledgerRepository.getCurrentBalance(),
  ]);

  await auditLogRepository.log({
    userId: session.user.id,
    action: "print",
    tableName: "reports",
    ipAddress: await getClientIp(),
  });

  return (
    <div className="mx-auto max-w-5xl bg-white p-8 text-black">
      <PrintTrigger />
      <div className="flex items-start justify-between border-b border-black pb-4">
        <div>
          <h1 className="text-xl font-bold">{settings.companyName}</h1>
          <p className="mt-1 text-sm text-gray-600">Transaction Report</p>
        </div>
        <p className="text-sm text-gray-600">
          {filters.dateFrom.toLocaleDateString("en-US")} – {filters.dateTo.toLocaleDateString("en-US")}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Current Balance</p>
          <p className="font-semibold">${currentBalance.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Income</p>
          <p className="font-semibold">${summary.totalIncome.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Sent</p>
          <p className="font-semibold">${summary.totalSent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Profit</p>
          <p className="font-semibold">${summary.totalProfit.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500">Transactions</p>
          <p className="font-semibold">{summary.transactionCount}</p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 pr-2">Type</th>
            <th className="py-1 pr-2">Transaction #</th>
            <th className="py-1 pr-2">Date</th>
            <th className="py-1 pr-2">Customer</th>
            <th className="py-1 pr-2">Beneficiary</th>
            <th className="py-1 pr-2 text-right">Amount</th>
            <th className="py-1 pr-2 text-right">Fee</th>
            <th className="py-1 pr-2 text-right">Total</th>
            <th className="py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.type}-${r.id}`} className="border-b border-gray-300">
              <td className="py-1 pr-2 capitalize">{r.type}</td>
              <td className="py-1 pr-2">{r.transactionNumber}</td>
              <td className="py-1 pr-2">{new Date(r.date).toLocaleDateString("en-US")}</td>
              <td className="py-1 pr-2">{r.customerName}</td>
              <td className="py-1 pr-2">{r.counterpartyName ?? "—"}</td>
              <td className="py-1 pr-2 text-right">{formatMoney(r.amount, r.currency)}</td>
              <td className="py-1 pr-2 text-right">{r.fee > 0 ? r.fee.toFixed(2) : "—"}</td>
              <td className="py-1 pr-2 text-right">{formatMoney(r.totalPaid, r.currency)}</td>
              <td className="py-1 capitalize">{r.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="py-6 text-center text-gray-500">
                No transactions in this range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
