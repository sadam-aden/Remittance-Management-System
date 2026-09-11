import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SentRow, SentCard } from "./sent-row";
import type { SentFormCurrencyOption, SentFormCustomerOption } from "./sent-form";
import type { SentTransaction, Customer } from "@/generated/prisma/client";

type Row = SentTransaction & { customer: Pick<Customer, "id" | "fullName" | "phone"> };

export function SentTable({
  rows,
  search,
  status,
  sort,
  page,
  pageSize,
  total,
  customers,
  currencies,
  defaultCurrency,
}: {
  rows: Row[];
  search?: string;
  status?: string;
  sort?: string;
  page: number;
  pageSize: number;
  total: number;
  customers: SentFormCustomerOption[];
  currencies: SentFormCurrencyOption[];
  defaultCurrency: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (sort && sort !== "date-desc") params.set("sort", sort);
    params.set("page", String(p));
    return `/sent?${params.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-hairline bg-card p-4">
      {rows.length === 0 ? (
        <div className="py-10 text-center text-text-muted">No sent transactions found.</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-text-muted">Transaction #</TableHead>
                  <TableHead className="text-text-muted">Date</TableHead>
                  <TableHead className="text-text-muted">Sender</TableHead>
                  <TableHead className="text-text-muted">Recipient</TableHead>
                  <TableHead className="text-text-muted">Destination</TableHead>
                  <TableHead className="text-text-muted">Amount</TableHead>
                  <TableHead className="text-text-muted">Total Paid</TableHead>
                  <TableHead className="text-text-muted">Status</TableHead>
                  <TableHead className="text-right text-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((tx) => (
                  <SentRow
                    key={tx.id}
                    tx={tx}
                    customers={customers}
                    currencies={currencies}
                    defaultCurrency={defaultCurrency}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((tx) => (
              <SentCard
                key={tx.id}
                tx={tx}
                customers={customers}
                currencies={currencies}
                defaultCurrency={defaultCurrency}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-hairline pt-4">
        <span className="text-xs text-text-muted">
          Page {page} of {totalPages} · {total} total
        </span>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" render={<Link href={pageHref(page - 1)} />}>
              <ChevronLeft size={14} /> Prev
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft size={14} /> Prev
            </Button>
          )}
          {page < totalPages ? (
            <Button variant="outline" size="sm" render={<Link href={pageHref(page + 1)} />}>
              Next <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
