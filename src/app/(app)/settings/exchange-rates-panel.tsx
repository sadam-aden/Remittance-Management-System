"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  exchangeRateFormSchema,
  type ExchangeRateFormInput,
  type ExchangeRateFormOutput,
} from "@/lib/validation/settings";
import { createExchangeRateAction, deleteExchangeRateAction } from "@/lib/actions/settings-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ExchangeRateRow {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  effectiveDate: Date;
}

export function ExchangeRatesPanel({
  rates,
  currencies,
}: {
  rates: ExchangeRateRow[];
  currencies: { code: string }[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ExchangeRateFormInput, unknown, ExchangeRateFormOutput>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: { baseCurrency: "", quoteCurrency: "" },
  });

  async function onSubmit(data: ExchangeRateFormOutput) {
    setIsSubmitting(true);
    const result = await createExchangeRateAction(data);
    setIsSubmitting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Exchange Rate Added");
    reset({ baseCurrency: data.baseCurrency, quoteCurrency: "" });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteExchangeRateAction(id);
    setDeletingId(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Exchange Rate Removed");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-6">
      <div>
        <h3 className="font-display font-semibold text-text-primary">Exchange Rates</h3>
        <p className="mt-1 text-sm text-text-muted">
          Reference values only, used to default new Sent Money forms — each transaction snapshots
          its own rate and is never recomputed from here.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label>Base</Label>
          <Controller
            control={control}
            name="baseCurrency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Base" />
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
        <div className="flex flex-col gap-1.5">
          <Label>Quote</Label>
          <Controller
            control={control}
            name="quoteCurrency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Quote" />
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rate">Rate</Label>
          <Input id="rate" type="number" step="0.0001" min="0" className="w-32" {...register("rate")} />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          <Plus size={14} /> Add
        </Button>
      </form>
      {(errors.baseCurrency || errors.quoteCurrency || errors.rate) && (
        <p className="text-xs text-sent">
          {errors.baseCurrency?.message || errors.quoteCurrency?.message || errors.rate?.message}
        </p>
      )}

      {rates.length === 0 ? (
        <p className="py-6 text-center text-text-muted">No exchange rates configured yet.</p>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-hairline hover:bg-transparent">
                  <TableHead className="text-text-muted">Base</TableHead>
                  <TableHead className="text-text-muted">Quote</TableHead>
                  <TableHead className="text-text-muted">Rate</TableHead>
                  <TableHead className="text-text-muted">Effective Date</TableHead>
                  <TableHead className="text-right text-text-muted">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id} className="border-hairline hover:bg-hairline/30">
                    <TableCell className="text-text-primary">{r.baseCurrency}</TableCell>
                    <TableCell className="text-text-primary">{r.quoteCurrency}</TableCell>
                    <TableCell className="text-text-muted">
                      {Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-text-muted">
                      {new Date(r.effectiveDate).toLocaleDateString("en-US")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.id)}
                        aria-label="Delete exchange rate"
                      >
                        <Trash2 size={14} className="text-sent" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            {rates.map((r) => (
              <div key={r.id} className="rounded-xl border border-hairline bg-panel p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-text-primary">
                    {r.baseCurrency} → {r.quoteCurrency}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === r.id}
                    onClick={() => handleDelete(r.id)}
                    aria-label="Delete exchange rate"
                  >
                    <Trash2 size={14} className="text-sent" />
                  </Button>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
                  <span>Rate: {Number(r.rate).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                  <span>{new Date(r.effectiveDate).toLocaleDateString("en-US")}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
