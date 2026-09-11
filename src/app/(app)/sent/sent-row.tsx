"use client";

import { useState } from "react";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shell/status-badge";
import { SentStatusMenu } from "./sent-status-menu";
import { SentDetailDialog } from "./sent-detail-dialog";
import { SentFormDialog } from "./sent-form-dialog";
import type {
  SentFormCurrencyOption,
  SentFormCustomerOption,
  SentFormPrefillValues,
} from "./sent-form";
import { COUNTRIES } from "@/lib/validation/sent";
import { formatMoney } from "@/lib/currency-format";
import type { SentTransaction, Customer } from "@/generated/prisma/client";

type Row = SentTransaction & { customer: Pick<Customer, "id" | "fullName" | "phone"> };

function buildPrefill(tx: Row): SentFormPrefillValues {
  const resolvedCountry = (COUNTRIES as readonly string[]).includes(tx.country ?? "")
    ? (tx.country as (typeof COUNTRIES)[number])
    : undefined;

  return {
    customerId: tx.customerId,
    beneficiaryId: tx.beneficiaryId,
    recipientName: tx.recipientName,
    recipientPhone: tx.recipientPhone ?? "",
    country: resolvedCountry,
    city: tx.city ?? "",
    amount: Number(tx.amount),
    currency: tx.currency,
    paymentMethod: tx.paymentMethod,
    notes: tx.notes ?? "",
  };
}

export function SentRow({
  tx,
  customers,
  currencies,
  defaultCurrency,
}: {
  tx: Row;
  customers: SentFormCustomerOption[];
  currencies: SentFormCurrencyOption[];
  defaultCurrency: string;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const prefill = buildPrefill(tx);

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
        <TableCell className="text-text-primary">
          <span className="flex items-center gap-1.5">
            {tx.recipientName}
            {tx.receiptImageUrl && (
              <a
                href={tx.receiptImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-muted hover:text-report"
                title="View receipt image"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip size={12} />
              </a>
            )}
          </span>
          {tx.recipientPhone && (
            <span className="block text-xs text-text-muted">{tx.recipientPhone}</span>
          )}
        </TableCell>
        <TableCell className="text-text-muted">
          {[tx.city, tx.country].filter(Boolean).join(", ") || "—"}
        </TableCell>
        <TableCell className="font-display text-sent">
          -{formatMoney(Number(tx.amount), tx.currency)}
        </TableCell>
        <TableCell className="text-text-muted">{formatMoney(Number(tx.totalPaid), tx.currency)}</TableCell>
        <TableCell>
          <StatusBadge status={tx.status} />
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <SentStatusMenu
            id={tx.id}
            status={tx.status}
            onDuplicate={() => setDuplicateOpen(true)}
          />
        </TableCell>
      </TableRow>
      <SentDetailDialog transaction={tx} open={detailOpen} onOpenChange={setDetailOpen} />
      <SentFormDialog
        customers={customers}
        currencies={currencies}
        defaultCurrency={defaultCurrency}
        prefill={prefill}
        title="Duplicate Transaction"
        trigger={null}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
    </>
  );
}

export function SentCard({
  tx,
  customers,
  currencies,
  defaultCurrency,
}: {
  tx: Row;
  customers: SentFormCustomerOption[];
  currencies: SentFormCurrencyOption[];
  defaultCurrency: string;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const prefill = buildPrefill(tx);

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
          <span className="flex items-center gap-1.5 truncate text-text-primary">
            {tx.recipientName}
            {tx.receiptImageUrl && (
              <a
                href={tx.receiptImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-muted hover:text-report"
                title="View receipt image"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip size={12} />
              </a>
            )}
          </span>
          <span className="font-display text-sent">-{formatMoney(Number(tx.amount), tx.currency)}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-muted">
          <span>{new Date(tx.date).toLocaleDateString("en-US")}</span>
          <span className="truncate text-right">Total: {formatMoney(Number(tx.totalPaid), tx.currency)}</span>
          <Link
            href={`/customers/${tx.customer.id}`}
            className="truncate hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {tx.customer.fullName}
          </Link>
          <span className="truncate text-right">
            {[tx.city, tx.country].filter(Boolean).join(", ") || "—"}
          </span>
        </div>
        <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <SentStatusMenu id={tx.id} status={tx.status} onDuplicate={() => setDuplicateOpen(true)} />
        </div>
      </div>
      <SentDetailDialog transaction={tx} open={detailOpen} onOpenChange={setDetailOpen} />
      <SentFormDialog
        customers={customers}
        currencies={currencies}
        defaultCurrency={defaultCurrency}
        prefill={prefill}
        title="Duplicate Transaction"
        trigger={null}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />
    </>
  );
}
