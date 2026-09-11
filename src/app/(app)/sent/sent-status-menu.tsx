"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateSentStatusAction } from "@/lib/actions/sent-actions";
import type { TransactionStatus } from "@/generated/prisma/client";

export function SentStatusMenu({
  id,
  status,
  onDuplicate,
}: {
  id: string;
  status: TransactionStatus;
  onDuplicate?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function changeStatus(next: TransactionStatus) {
    startTransition(async () => {
      const result = await updateSentStatusAction(id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next === "completed"
          ? "Transfer Marked Completed"
          : next === "cancelled"
            ? "Transfer Marked Cancelled"
            : "Transfer Marked Pending",
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
        {onDuplicate && (
          <>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy size={14} /> Duplicate Transaction
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
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
