"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerForm } from "./customer-form";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/customer-actions";
import type { CustomerFormInput } from "@/lib/validation/customer";

type Props =
  | { mode: "create" }
  | { mode: "edit"; customerId: string; defaultValues: CustomerFormInput };

export function CustomerFormDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: CustomerFormInput) {
    setIsSubmitting(true);
    const result =
      props.mode === "create"
        ? await createCustomerAction(data)
        : await updateCustomerAction(props.customerId, data);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(props.mode === "create" ? "Customer Added" : "Customer Updated");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          props.mode === "create" ? (
            <Button>
              <Plus size={16} /> Add Customer
            </Button>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label="Edit customer">
              <Pencil size={14} />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.mode === "create" ? "Add Customer" : "Edit Customer"}</DialogTitle>
        </DialogHeader>
        <CustomerForm
          defaultValues={props.mode === "edit" ? props.defaultValues : undefined}
          onSubmit={handleSubmit}
          submitLabel={props.mode === "create" ? "Add Customer" : "Save Changes"}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
