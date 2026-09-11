import type { Metadata } from "next";
import { sentRepository } from "@/lib/repositories/sent-repository";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { currencyRepository } from "@/lib/repositories/currency-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { parseSort } from "@/lib/sort-params";
import { SentTable } from "./sent-table";
import { SentFilters } from "./sent-filters";
import { SentFormDialog } from "./sent-form-dialog";
import type { TransactionStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Sent Money — Remittance Desk" };

const VALID_STATUSES = new Set(["pending", "completed", "cancelled"]);

export default async function SentMoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.q?.trim() || undefined;
  const status =
    params.status && VALID_STATUSES.has(params.status)
      ? (params.status as TransactionStatus)
      : undefined;
  const { sortBy, sortDir, sortValue } = parseSort(params.sort);
  const pageSize = 20;

  const [{ items, total }, customersResult, currencies, settings] = await Promise.all([
    sentRepository.list({ search, status, page, pageSize, sortBy, sortDir }),
    customerRepository.list({ pageSize: 500 }),
    currencyRepository.listActive(),
    settingsRepository.get(),
  ]);

  const customerOptions = customersResult.items.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
  }));
  const currencyOptions = currencies.map((c) => ({ code: c.code, name: c.name }));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">Sent Money</h2>
          <p className="text-sm text-text-muted">{total} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SentFilters initialSearch={search} initialStatus={status} initialSort={sortValue} />
          <SentFormDialog
            customers={customerOptions}
            currencies={currencyOptions}
            defaultCurrency={settings.defaultCurrency}
          />
        </div>
      </div>
      <SentTable
        rows={items}
        search={search}
        status={status}
        sort={sortValue}
        page={page}
        pageSize={pageSize}
        total={total}
        customers={customerOptions}
        currencies={currencyOptions}
        defaultCurrency={settings.defaultCurrency}
      />
    </div>
  );
}
