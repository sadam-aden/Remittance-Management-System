"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UserMenu({ name, email }: { name?: string | null; email: string }) {
  return (
    <form action={logoutAction} className="flex items-center gap-3">
      <div className="hidden flex-col items-end sm:flex">
        <span className="text-sm text-text-primary">{name ?? email}</span>
        <span className="text-xs text-text-muted">{email}</span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="submit"
              variant="outline"
              size="icon"
              className="rounded-full border-hairline bg-card"
              aria-label="Sign out"
            >
              <LogOut size={16} className="text-text-muted" />
            </Button>
          }
        />
        <TooltipContent>Sign out</TooltipContent>
      </Tooltip>
    </form>
  );
}
