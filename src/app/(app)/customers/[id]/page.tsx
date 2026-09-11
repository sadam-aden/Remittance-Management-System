import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { StatusBadge } from "@/components/shell/status-badge";
import { formatMoney } from "@/lib/currency-format";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { customer, incomeTransactions, sentTransactions } =
    await customerRepository.findByIdWithHistory(id);
  if (!customer) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Link
        href="/customers"
        className="flex w-fit items-center gap-1 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft size={14} /> Back to Customers
      </Link>

      <div className="rounded-2xl border border-hairline bg-card p-6">
        <h2 className="font-display text-xl font-semibold text-text-primary">{customer.fullName}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
          <Field label="National ID" value={customer.nationalId} />
          <Field label="Country" value={customer.country} />
          <Field label="City" value={customer.city} />
          <Field label="Address" value={customer.address} />
        </div>
        {customer.notes && (
          <div className="mt-4">
            <p className="text-xs text-text-muted">Notes</p>
            <p className="mt-1 text-sm text-text-primary">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-hairline bg-card p-6">
        <h3 className="font-display font-semibold text-text-primary">Income Transaction History</h3>
        <div className="mt-4 flex flex-col divide-y divide-hairline">
          {incomeTransactions.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">No income transactions yet.</p>
          )}
          {incomeTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-text-primary">{tx.transactionNumber}</p>
                <p className="text-xs text-text-muted">
                  {tx.date.toLocaleDateString("en-US")} · {tx.paymentMethod}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-income">
                  +{formatMoney(Number(tx.amount), tx.currency)}
                </span>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-card p-6">
        <h3 className="font-display font-semibold text-text-primary">Sent Transaction History</h3>
        <div className="mt-4 flex flex-col divide-y divide-hairline">
          {sentTransactions.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">No sent transactions yet.</p>
          )}
          {sentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="text-text-primary">{tx.transactionNumber}</p>
                <p className="text-xs text-text-muted">
                  {tx.date.toLocaleDateString("en-US")} · to {tx.recipientName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-sent">
                  -{formatMoney(Number(tx.amount), tx.currency)}
                </span>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 text-text-primary">{value ?? "—"}</p>
    </div>
  );
}
