"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  settingsFormSchema,
  type SettingsFormInput,
  type SettingsFormOutput,
} from "@/lib/validation/settings";
import { updateSettingsAction } from "@/lib/actions/settings-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogoUpload } from "./logo-upload";

export interface SettingsFormCurrencyOption {
  code: string;
  name: string;
}

export interface SettingsFormInitial {
  companyName: string;
  logoUrl: string | null;
  defaultCurrency: string;
  businessAddress: string | null;
  phoneNumbers: string | null;
  receiptFooter: string | null;
  taxEnabled: boolean;
  taxRate: number;
}

export function SettingsForm({
  initial,
  currencies,
}: {
  initial: SettingsFormInitial;
  currencies: SettingsFormCurrencyOption[];
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<SettingsFormInput, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      companyName: initial.companyName,
      defaultCurrency: initial.defaultCurrency,
      businessAddress: initial.businessAddress ?? "",
      phoneNumbers: initial.phoneNumbers ?? "",
      receiptFooter: initial.receiptFooter ?? "",
      taxEnabled: initial.taxEnabled,
      taxRate: initial.taxRate,
    },
  });

  const taxEnabled = watch("taxEnabled");

  async function onSubmit(data: SettingsFormOutput) {
    setIsSubmitting(true);
    const result = await updateSettingsAction(data, logoUrl !== initial.logoUrl ? logoUrl : undefined);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings Saved Successfully");
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-2xl border border-hairline bg-card p-6"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label>Company Logo</Label>
        <LogoUpload value={logoUrl} onChange={setLogoUrl} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" {...register("companyName")} />
          {errors.companyName && <p className="text-xs text-sent">{errors.companyName.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Default Currency</Label>
          <Controller
            control={control}
            name="defaultCurrency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="businessAddress">Business Address</Label>
        <Textarea id="businessAddress" rows={2} {...register("businessAddress")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phoneNumbers">Phone Numbers</Label>
        <Input id="phoneNumbers" {...register("phoneNumbers")} placeholder="+252 61 xxx xxxx, +252 63 xxx xxxx" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="receiptFooter">Receipt Footer</Label>
        <Textarea
          id="receiptFooter"
          rows={2}
          {...register("receiptFooter")}
          placeholder="Thank you for your business!"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline pt-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="taxEnabled">Enable Tax</Label>
          <Controller
            control={control}
            name="taxEnabled"
            render={({ field }) => (
              <Switch id="taxEnabled" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
        {taxEnabled && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input id="taxRate" type="number" step="0.01" min="0" max="100" {...register("taxRate")} />
            {errors.taxRate && <p className="text-xs text-sent">{errors.taxRate.message}</p>}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
