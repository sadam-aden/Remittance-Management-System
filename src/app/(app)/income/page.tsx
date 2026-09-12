import type { Metadata } from "next";
import { incomeRepository } from "@/lib/repositories/income-repository";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { currencyRepository } from "@/lib/repositories/currency-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { parseSort } from "@/lib/sort-params";
import { IncomeTable } from "./income-table";
import { IncomeFilters } from "./income-filters";
import { IncomeFormDialog } from "./income-form-dialog";
import type { TransactionStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Income — Remittance Desk" };

const VALID_STATUSES = new Set(["pending", "completed", "cancelled"]);

export default async function IncomePage({
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
    incomeRepository.list({ search, status, page, pageSize, sortBy, sortDir }),
    customerRepository.list({ pageSize: 500, sortBy: "fullName", sortDir: "asc" }),
    currencyRepository.listActive(),
    settingsRepository.get(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">Income</h2>
          <p className="text-sm text-text-muted">{total} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IncomeFilters initialSearch={search} initialStatus={status} initialSort={sortValue} />
          <IncomeFormDialog
            customers={customersResult.items.map((c) => ({ id: c.id, fullName: c.fullName }))}
            currencies={currencies.map((c) => ({ code: c.code, name: c.name }))}
            defaultCurrency={settings.defaultCurrency}
          />
        </div>
      </div>
      <IncomeTable
        rows={items}
        search={search}
        status={status}
        sort={sortValue}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}
