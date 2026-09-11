"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shell/status-badge";
import { formatMoney } from "@/lib/currency-format";
import type { IncomeTransaction, Customer } from "@/generated/prisma/client";

type Row = IncomeTransaction & { customer: Pick<Customer, "id" | "fullName" | "phone"> };

export function IncomeDetailDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Row;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tx = transaction;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tx.transactionNumber}
            <StatusBadge status={tx.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Date" value={new Date(tx.date).toLocaleDateString("en-US")} />
          <Field
            label="Amount"
            value={formatMoney(Number(tx.amount), tx.currency)}
            valueClassName="text-income font-display"
          />
          <Field
            label="Customer"
            value={
              <Link href={`/customers/${tx.customer.id}`} className="hover:underline">
                {tx.customer.fullName}
              </Link>
            }
          />
          <Field label="Customer Phone" value={tx.customer.phone} />
          <Field label="Payment Method" value={tx.paymentMethod} />
          <Field label="Reference Number" value={tx.referenceNumber} />
        </div>

        {tx.notes && (
          <div>
            <p className="text-xs text-text-muted">Notes</p>
            <p className="mt-1 text-sm text-text-primary">{tx.notes}</p>
          </div>
        )}

        <div className="border-t border-hairline pt-3 text-xs text-text-muted">
          Recorded {new Date(tx.createdAt).toLocaleString("en-US")}
          {tx.updatedAt.getTime() !== tx.createdAt.getTime() &&
            ` · Last updated ${new Date(tx.updatedAt).toLocaleString("en-US")}`}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value?: string | null | ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-0.5 text-text-primary ${valueClassName ?? ""}`}>{value ?? "—"}</p>
    </div>
  );
}
