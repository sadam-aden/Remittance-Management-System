"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortSelect } from "@/components/shell/sort-select";
import type { SortValue } from "@/lib/sort-params";

export function IncomeFilters({
  initialSearch,
  initialStatus,
  initialSort,
}: {
  initialSearch?: string;
  initialStatus?: string;
  initialSort?: SortValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleStatusChange(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "all") params.set("status", status);
    else params.delete("status");
    params.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-hairline bg-card px-3 py-2 text-text-muted focus-within:border-report">
        <Search size={15} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search transaction #, customer, phone, reference…"
          className="w-64 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>
      <Select defaultValue={initialStatus ?? "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <SortSelect initialSort={initialSort} />
    </div>
  );
}
