"use client";

import { useState, type ReactElement } from "react";
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
  SentForm,
  type SentFormCurrencyOption,
  type SentFormCustomerOption,
  type SentFormPrefillValues,
} from "./sent-form";
import { createSentAction } from "@/lib/actions/sent-actions";
import type { SentFormOutput } from "@/lib/validation/sent";

export function SentFormDialog({
  customers,
  currencies,
  defaultCurrency,
  prefill,
  title = "Send Money",
  /** Custom trigger element; pass `null` to render no trigger and drive the dialog purely via `open`/`onOpenChange` (e.g. a row's "Duplicate" menu item). Omit for the default "+ Send Money" button. */
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  customers: SentFormCustomerOption[];
  currencies: SentFormCurrencyOption[];
  defaultCurrency: string;
  prefill?: SentFormPrefillValues;
  title?: string;
  trigger?: ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  async function handleSubmit(
    data: SentFormOutput,
    receiptImageUrl: string | null,
    beneficiaryId: string | null,
  ) {
    setIsSubmitting(true);
    const result = await createSentAction(data, idempotencyKey, receiptImageUrl, beneficiaryId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Transfer Sent Successfully");
    setIdempotencyKey(crypto.randomUUID());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button>
                <Plus size={16} /> Send Money
              </Button>
            )
          }
        />
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SentForm
          customers={customers}
          currencies={currencies}
          defaultCurrency={defaultCurrency}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          prefill={prefill}
        />
      </DialogContent>
    </Dialog>
  );
}
