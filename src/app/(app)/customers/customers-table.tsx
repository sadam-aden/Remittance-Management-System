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
import { CustomerFormDialog } from "./customer-form-dialog";
import { CustomerDeleteButton } from "./customer-delete-button";
import type { Customer } from "@/generated/prisma/client";

export function CustomersTable({
  customers,
  search,
  page,
  pageSize,
  total,
}: {
  customers: Customer[];
  search?: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    params.set("page", String(p));
    return `/customers?${params.toString()}`;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-hairline bg-card p-4">
      {customers.length === 0 ? (
        <div className="py-10 text-center text-text-muted">No customers found.</div>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-text-muted">Name</TableHead>
                  <TableHead className="text-text-muted">Phone</TableHead>
                  <TableHead className="text-text-muted">Country / City</TableHead>
                  <TableHead className="text-text-muted">Email</TableHead>
                  <TableHead className="text-right text-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="border-hairline hover:bg-hairline/30">
                    <TableCell className="font-medium text-text-primary">
                      <Link href={`/customers/${customer.id}`} className="hover:underline">
                        {customer.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-muted">{customer.phone ?? "—"}</TableCell>
                    <TableCell className="text-text-muted">
                      {[customer.city, customer.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-text-muted">{customer.email ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <CustomerFormDialog
                          mode="edit"
                          customerId={customer.id}
                          defaultValues={{
                            fullName: customer.fullName,
                            phone: customer.phone ?? "",
                            email: customer.email ?? "",
                            nationalId: customer.nationalId ?? "",
                            country: customer.country ?? "",
                            city: customer.city ?? "",
                            address: customer.address ?? "",
                            notes: customer.notes ?? "",
                          }}
                        />
                        <CustomerDeleteButton customerId={customer.id} customerName={customer.fullName} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-xl border border-hairline bg-panel p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium text-text-primary hover:underline"
                  >
                    {customer.fullName}
                  </Link>
                  <div className="flex items-center gap-1">
                    <CustomerFormDialog
                      mode="edit"
                      customerId={customer.id}
                      defaultValues={{
                        fullName: customer.fullName,
                        phone: customer.phone ?? "",
                        email: customer.email ?? "",
                        nationalId: customer.nationalId ?? "",
                        country: customer.country ?? "",
                        city: customer.city ?? "",
                        address: customer.address ?? "",
                        notes: customer.notes ?? "",
                      }}
                    />
                    <CustomerDeleteButton customerId={customer.id} customerName={customer.fullName} />
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
                  <span>{customer.phone ?? "—"}</span>
                  <span>{[customer.city, customer.country].filter(Boolean).join(", ") || "—"}</span>
                </div>
                {customer.email && (
                  <div className="mt-1 text-xs text-text-muted">{customer.email}</div>
                )}
              </div>
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
