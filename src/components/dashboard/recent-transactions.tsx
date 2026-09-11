import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatMoney } from "@/lib/currency-format";
import type { RecentTransactionRow } from "@/lib/repositories/dashboard-repository";

export function RecentTransactions({ rows }: { rows: RecentTransactionRow[] }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-6">
      <h2 className="font-display font-semibold text-text-primary">Recent Transactions</h2>
      <p className="mt-1 mb-4 text-sm text-text-muted">Latest activity</p>
      <div className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">No transactions yet.</p>
        )}
        {rows.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  t.type === "income" ? "bg-income-dim" : "bg-sent-dim"
                }`}
              >
                {t.type === "income" ? (
                  <ArrowDownCircle size={15} className="text-income" />
                ) : (
                  <ArrowUpCircle size={15} className="text-sent" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-text-primary">{t.who}</span>
                <span className="text-xs text-text-muted">{t.transactionNumber}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span
                className={`font-display text-sm ${t.type === "income" ? "text-income" : "text-sent"}`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatMoney(t.amount, t.currency)}
              </span>
              <span
                className={`text-[11px] capitalize ${
                  t.status === "completed" ? "text-text-muted" : "text-report"
                }`}
              >
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
