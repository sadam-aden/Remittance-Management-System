"use client";

import { useState } from "react";
import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shell/status-badge";
import { IncomeStatusMenu } from "./income-status-menu";
import { IncomeDetailDialog } from "./income-detail-dialog";
import { formatMoney } from "@/lib/currency-format";
import type { IncomeTransaction, Customer } from "@/generated/prisma/client";

type Row = IncomeTransaction & { customer: Pick<Customer, "id" | "fullName" | "phone"> };

export function IncomeRow({ tx }: { tx: Row }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <TableRow
        className="cursor-pointer border-hairline hover:bg-hairline/30"
        onClick={() => setDetailOpen(true)}
      >
        <TableCell className="font-medium text-text-primary">{tx.transactionNumber}</TableCell>
        <TableCell className="text-text-muted">
          {new Date(tx.date).toLocaleDateString("en-US")}
        </TableCell>
        <TableCell className="text-text-muted">
          <Link
            href={`/customers/${tx.customer.id}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {tx.customer.fullName}
          </Link>
        </TableCell>
        <TableCell className="font-display text-income">
          +{formatMoney(Number(tx.amount), tx.currency)}
        </TableCell>
        <TableCell className="text-text-muted">{tx.paymentMethod}</TableCell>
        <TableCell>
          <StatusBadge status={tx.status} />
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <IncomeStatusMenu id={tx.id} status={tx.status} />
        </TableCell>
      </TableRow>
      <IncomeDetailDialog transaction={tx} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}

export function IncomeCard({ tx }: { tx: Row }) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <div
        className="rounded-xl border border-hairline bg-panel p-3"
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-text-primary">{tx.transactionNumber}</span>
          <StatusBadge status={tx.status} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Link
            href={`/customers/${tx.customer.id}`}
            className="truncate text-text-muted hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {tx.customer.fullName}
          </Link>
          <span className="font-display text-income">+{formatMoney(Number(tx.amount), tx.currency)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
          <span>{new Date(tx.date).toLocaleDateString("en-US")}</span>
          <span>{tx.paymentMethod}</span>
        </div>
        <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <IncomeStatusMenu id={tx.id} status={tx.status} />
        </div>
      </div>
      <IncomeDetailDialog transaction={tx} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
