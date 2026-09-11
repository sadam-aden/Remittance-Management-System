// Display-only symbol lookup — matches the seeded currencies (see migration
// 20260906120100) plus a few common ones for robustness. Falls back to the
// raw ISO code for anything unrecognized, so an unseeded currency never
// silently shows nothing. Exports (CSV/Excel/PDF) deliberately keep the ISO
// code instead of this symbol — a bank statement or accounting import needs
// the unambiguous code, not a symbol that could mean several currencies.
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  DJF: "Fdj",
  SOS: "Sh",
  AED: "د.إ",
  SAR: "﷼",
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

export function formatMoney(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
