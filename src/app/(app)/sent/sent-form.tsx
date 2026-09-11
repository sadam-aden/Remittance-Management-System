"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sentFormSchema,
  type SentFormInput,
  type SentFormOutput,
  PAYMENT_METHODS,
  COUNTRIES,
  CITIES_BY_COUNTRY,
  OTHER_CITY,
  DEFAULT_FEE_RATE,
} from "@/lib/validation/sent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReceiptUpload } from "@/components/receipt-upload";
import { BeneficiaryLookup, type SelectedBeneficiary } from "./beneficiary-lookup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SentFormCurrencyOption {
  code: string;
  name: string;
}
export interface SentFormCustomerOption {
  id: string;
  fullName: string;
  phone?: string | null;
}

/** Carries a past transaction's values into a fresh form — see SentRow's "Duplicate" action. Date is deliberately excluded (always defaults to today) and so is the receipt image (a new transaction needs its own). */
export interface SentFormPrefillValues {
  customerId: string;
  beneficiaryId: string | null;
  recipientName: string;
  recipientPhone: string;
  country?: (typeof COUNTRIES)[number];
  city: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  notes: string;
}

export function SentForm({
  customers,
  currencies,
  defaultCurrency,
  onSubmit,
  isSubmitting,
  prefill,
}: {
  customers: SentFormCustomerOption[];
  currencies: SentFormCurrencyOption[];
  defaultCurrency: string;
  onSubmit: (
    data: SentFormOutput,
    receiptImageUrl: string | null,
    beneficiaryId: string | null,
  ) => void | Promise<void>;
  isSubmitting: boolean;
  prefill?: SentFormPrefillValues;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(prefill?.beneficiaryId ?? null);
  const [cityMode, setCityMode] = useState<"select" | "other">(() => {
    if (prefill?.country && prefill.city) {
      const known = CITIES_BY_COUNTRY[prefill.country] ?? [];
      return known.includes(prefill.city) ? "select" : "other";
    }
    return "select";
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<SentFormInput, unknown, SentFormOutput>({
    resolver: zodResolver(sentFormSchema),
    defaultValues: {
      date: today,
      customerId: prefill?.customerId ?? "",
      recipientName: prefill?.recipientName ?? "",
      recipientPhone: prefill?.recipientPhone ?? "",
      country: prefill?.country,
      city: prefill?.city ?? "",
      currency: prefill?.currency ?? defaultCurrency,
      amount: prefill?.amount,
      transferFee: 0,
      exchangeRate: 1,
      paymentMethod: prefill?.paymentMethod ?? "",
      notes: prefill?.notes ?? "",
    },
  });

  const amount = watch("amount");
  const transferFee = watch("transferFee");
  const customerId = watch("customerId");
  const country = watch("country");
  const senderPhone = customers.find((c) => c.id === customerId)?.phone;
  const cityOptions = country ? CITIES_BY_COUNTRY[country] : [];

  function handleBeneficiarySelect(b: SelectedBeneficiary) {
    setBeneficiaryId(b.id);
    setValue("recipientName", b.fullName, { shouldValidate: true });
    setValue("recipientPhone", b.phone ?? "");

    // Only apply the saved country if it's still one of the two we serve —
    // older/foreign data shouldn't silently force an invalid enum value.
    let resolvedCountry: (typeof COUNTRIES)[number] | undefined;
    if (b.country && (COUNTRIES as readonly string[]).includes(b.country)) {
      resolvedCountry = b.country as (typeof COUNTRIES)[number];
      setValue("country", resolvedCountry, { shouldValidate: true });
    }

    if (b.city) {
      const knownCities = resolvedCountry ? CITIES_BY_COUNTRY[resolvedCountry] : [];
      setCityMode(knownCities.includes(b.city) ? "select" : "other");
      setValue("city", b.city);
    }
  }

  // Auto-fill the fee as DEFAULT_FEE_RATE of the amount ($2.50 per $100 sent),
  // but stop the moment the admin edits it directly — dirtyFields only flips
  // true for user-driven changes since this writes with shouldDirty: false.
  useEffect(() => {
    if (dirtyFields.transferFee) return;
    const amountNum = Number(amount);
    if (Number.isFinite(amountNum)) {
      setValue("transferFee", Math.round(amountNum * DEFAULT_FEE_RATE * 100) / 100, {
        shouldDirty: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  // Auto-fill Total Paid as amount + fee, same stop-on-manual-edit rule.
  useEffect(() => {
    if (dirtyFields.totalPaid) return;
    const amountNum = Number(amount);
    const feeNum = Number(transferFee);
    if (Number.isFinite(amountNum) && Number.isFinite(feeNum)) {
      setValue("totalPaid", Math.round((amountNum + feeNum) * 100) / 100, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, transferFee]);

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, receiptImageUrl, beneficiaryId))}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-sent">{errors.date.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sender</Label>
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the paying customer" />
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
          {senderPhone && <p className="text-xs text-text-muted">{senderPhone}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Recipient Lookup</Label>
        <BeneficiaryLookup
          onSelect={handleBeneficiarySelect}
          initialSelected={
            prefill
              ? {
                  id: prefill.beneficiaryId,
                  fullName: prefill.recipientName,
                  phone: prefill.recipientPhone || null,
                  country: prefill.country ?? null,
                  city: prefill.city || null,
                }
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientName">Recipient Name</Label>
          <Input id="recipientName" {...register("recipientName")} />
          {errors.recipientName && (
            <p className="text-xs text-sent">{errors.recipientName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recipientPhone">Recipient Phone</Label>
          <Input id="recipientPhone" {...register("recipientPhone")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Country</Label>
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  // A manual country change invalidates whatever city was
                  // picked for the old country's list — but this must NOT
                  // fire when country is set programmatically by the
                  // beneficiary lookup (that sets its own matching city right
                  // after), so it lives here rather than in a useEffect.
                  setValue("city", "");
                  setCityMode("select");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <p className="text-xs text-sent">{errors.country.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>City</Label>
          {cityMode === "other" ? (
            <div className="flex gap-2">
              <Input id="city" {...register("city")} placeholder="Enter city" className="flex-1" />
              {cityOptions.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCityMode("select");
                    setValue("city", "");
                  }}
                >
                  List
                </Button>
              )}
            </div>
          ) : (
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v === OTHER_CITY) {
                      setCityMode("other");
                      setValue("city", "");
                    } else {
                      field.onChange(v);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={country ? "Select a city" : "Select a country first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_CITY}>Other (type manually)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
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
        {errors.paymentMethod && (
          <p className="text-xs text-sent">{errors.paymentMethod.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} />
          {errors.amount && <p className="text-xs text-sent">{errors.amount.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transferFee">Fee</Label>
          <Input id="transferFee" type="number" step="0.01" min="0" {...register("transferFee")} />
          {errors.transferFee && <p className="text-xs text-sent">{errors.transferFee.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exchangeRate">Exchange Rate</Label>
          <Input id="exchangeRate" type="number" step="0.0001" min="0" {...register("exchangeRate")} />
          {errors.exchangeRate && (
            <p className="text-xs text-sent">{errors.exchangeRate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totalPaid">Total Paid</Label>
          <Input id="totalPaid" type="number" step="0.01" min="0" {...register("totalPaid")} />
          {errors.totalPaid && <p className="text-xs text-sent">{errors.totalPaid.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Receipt Image</Label>
        <ReceiptUpload value={receiptImageUrl} onChange={setReceiptImageUrl} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Saving..." : "Send Money"}
      </Button>
    </form>
  );
}
