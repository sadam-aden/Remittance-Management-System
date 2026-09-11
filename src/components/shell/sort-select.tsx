"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortValue } from "@/lib/sort-params";

export function SortSelect({ initialSort }: { initialSort?: SortValue }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(sort: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort && sort !== "date-desc") params.set("sort", sort);
    else params.delete("sort");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select defaultValue={initialSort ?? "date-desc"} onValueChange={handleChange}>
      <SelectTrigger className="w-52">
        <ArrowUpDown size={14} className="text-text-muted" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
