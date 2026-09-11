"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  IncomeForm,
  type IncomeFormCustomerOption,
  type IncomeFormCurrencyOption,
} from "./income-form";
import { createIncomeAction } from "@/lib/actions/income-actions";
import type { IncomeFormOutput } from "@/lib/validation/income";

export function IncomeFormDialog({
  customers,
  currencies,
  defaultCurrency,
}: {
  customers: IncomeFormCustomerOption[];
  currencies: IncomeFormCurrencyOption[];
  defaultCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  async function handleSubmit(data: IncomeFormOutput) {
    setIsSubmitting(true);
    const result = await createIncomeAction(data, idempotencyKey);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Income Recorded Successfully");
    setIdempotencyKey(crypto.randomUUID());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus size={16} /> Record Income
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Income</DialogTitle>
        </DialogHeader>
        <IncomeForm
          customers={customers}
          currencies={currencies}
          defaultCurrency={defaultCurrency}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
