"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateIncomeStatusAction } from "@/lib/actions/income-actions";
import type { TransactionStatus } from "@/generated/prisma/client";

export function IncomeStatusMenu({ id, status }: { id: string; status: TransactionStatus }) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(next: TransactionStatus) {
    startTransition(async () => {
      const result = await updateIncomeStatusAction(id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next === "completed"
          ? "Income Marked Completed"
          : next === "cancelled"
            ? "Income Marked Cancelled"
            : "Income Marked Pending",
      );
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Change status">
            <MoreHorizontal size={16} />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={status === "completed"} onClick={() => changeStatus("completed")}>
          Mark Completed
        </DropdownMenuItem>
        <DropdownMenuItem disabled={status === "cancelled"} onClick={() => changeStatus("cancelled")}>
          Mark Cancelled
        </DropdownMenuItem>
        <DropdownMenuItem disabled={status === "pending"} onClick={() => changeStatus("pending")}>
          Mark Pending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
