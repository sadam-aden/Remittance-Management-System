"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  incomeFormSchema,
  type IncomeFormInput,
  type IncomeFormOutput,
  PAYMENT_METHODS,
} from "@/lib/validation/income";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface IncomeFormCustomerOption {
  id: string;
  fullName: string;
}
export interface IncomeFormCurrencyOption {
  code: string;
  name: string;
}

export function IncomeForm({
  customers,
  currencies,
  defaultCurrency,
  onSubmit,
  isSubmitting,
}: {
  customers: IncomeFormCustomerOption[];
  currencies: IncomeFormCurrencyOption[];
  defaultCurrency: string;
  onSubmit: (data: IncomeFormOutput) => void | Promise<void>;
  isSubmitting: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IncomeFormInput, unknown, IncomeFormOutput>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      date: today,
      customerId: "",
      currency: defaultCurrency,
      paymentMethod: "",
      referenceNumber: "",
      notes: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-sent">{errors.date.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Customer</Label>
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer">
                    {(value: string) => customers.find((c) => c.id === value)?.fullName ?? "Select a customer"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.customerId && <p className="text-xs text-sent">{errors.customerId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
          {errors.amount && <p className="text-xs text-sent">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Currency</Label>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Payment Method</Label>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.paymentMethod && <p className="text-xs text-sent">{errors.paymentMethod.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="referenceNumber">Reference Number</Label>
        <Input id="referenceNumber" {...register("referenceNumber")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Saving..." : "Record Income"}
      </Button>
    </form>
  );
}
