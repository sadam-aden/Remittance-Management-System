import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shell/status-badge";
import { formatMoney } from "@/lib/currency-format";
import type { ReportRow } from "@/lib/repositories/reports-repository";

function ReportCard({ r }: { r: ReportRow }) {
  return (
    <div className="rounded-xl border border-hairline bg-panel p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs capitalize text-text-muted">{r.type}</span>
        <StatusBadge status={r.status} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="font-medium text-text-primary">{r.transactionNumber}</span>
        <span className={`font-display ${r.type === "income" ? "text-income" : "text-sent"}`}>
          {r.type === "income" ? "+" : "-"}
          {formatMoney(r.amount, r.currency)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-muted">
        <span>{new Date(r.date).toLocaleDateString("en-US")}</span>
        <span className="text-right">Total: {formatMoney(r.totalPaid, r.currency)}</span>
        <span className="truncate">{r.customerName}</span>
        <span className="truncate text-right">{r.counterpartyName ?? "—"}</span>
        {r.fee > 0 && (
          <span className="col-span-2 text-right">
            Fee: {r.fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReportTable({ rows }: { rows: ReportRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-card p-4">
        <div className="py-10 text-center text-text-muted">No transactions in this range.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-card p-4">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-hairline hover:bg-transparent">
              <TableHead className="text-text-muted">Type</TableHead>
              <TableHead className="text-text-muted">Transaction #</TableHead>
              <TableHead className="text-text-muted">Date</TableHead>
              <TableHead className="text-text-muted">Customer</TableHead>
              <TableHead className="text-text-muted">Beneficiary</TableHead>
              <TableHead className="text-text-muted">Amount</TableHead>
              <TableHead className="text-text-muted">Fee</TableHead>
              <TableHead className="text-text-muted">Total</TableHead>
              <TableHead className="text-text-muted">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.type}-${r.id}`} className="border-hairline hover:bg-hairline/30">
                <TableCell className="capitalize text-text-muted">{r.type}</TableCell>
                <TableCell className="font-medium text-text-primary">{r.transactionNumber}</TableCell>
                <TableCell className="text-text-muted">
                  {new Date(r.date).toLocaleDateString("en-US")}
                </TableCell>
                <TableCell className="text-text-muted">{r.customerName}</TableCell>
                <TableCell className="text-text-muted">{r.counterpartyName ?? "—"}</TableCell>
                <TableCell
                  className={`font-display ${r.type === "income" ? "text-income" : "text-sent"}`}
                >
                  {r.type === "income" ? "+" : "-"}
                  {formatMoney(r.amount, r.currency)}
                </TableCell>
                <TableCell className="text-text-muted">
                  {r.fee > 0 ? r.fee.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                </TableCell>
                <TableCell className="text-text-muted">{formatMoney(r.totalPaid, r.currency)}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <ReportCard key={`${r.type}-${r.id}`} r={r} />
        ))}
      </div>
    </div>
  );
}
