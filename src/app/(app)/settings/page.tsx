import type { Metadata } from "next";
import { currencyRepository } from "@/lib/repositories/currency-repository";
import { exchangeRateRepository } from "@/lib/repositories/exchange-rate-repository";
import { userRepository } from "@/lib/repositories/user-repository";
import { requireAdmin } from "@/lib/auth-helpers";
import { ExchangeRatesPanel } from "./exchange-rates-panel";
import { UsersPanel } from "./users-panel";

export const metadata: Metadata = { title: "Settings — Remittance Desk" };

export default async function SettingsPage() {
  const session = await requireAdmin();
  const [currencies, rates, users] = await Promise.all([
    currencyRepository.listActive(),
    exchangeRateRepository.list(),
    userRepository.list(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">Settings</h2>
        <p className="text-sm text-text-muted">Currencies and user accounts</p>
      </div>

      <ExchangeRatesPanel
        rates={rates.map((r) => ({
          id: r.id,
          baseCurrency: r.baseCurrency,
          quoteCurrency: r.quoteCurrency,
          rate: r.rate.toString(),
          effectiveDate: r.effectiveDate,
        }))}
        currencies={currencies.map((c) => ({ code: c.code }))}
      />

      <UsersPanel users={users} currentUserId={session.user.id} />
    </div>
  );
}
