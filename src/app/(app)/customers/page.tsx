import type { Metadata } from "next";
import { customerRepository } from "@/lib/repositories/customer-repository";
import { CustomersTable } from "./customers-table";
import { CustomersSearch } from "./customers-search";
import { CustomerFormDialog } from "./customer-form-dialog";

export const metadata: Metadata = { title: "Customers — Remittance Desk" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const search = params.q?.trim() || undefined;
  const pageSize = 20;

  const { items, total } = await customerRepository.list({ search, page, pageSize });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">Customers</h2>
          <p className="text-sm text-text-muted">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <CustomersSearch initialValue={search} />
          <CustomerFormDialog mode="create" />
        </div>
      </div>
      <CustomersTable customers={items} search={search} page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
