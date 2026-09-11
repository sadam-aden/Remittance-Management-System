export const SORT_VALUES = [
  "date-desc",
  "date-asc",
  "transactionNumber-desc",
  "transactionNumber-asc",
  "amount-desc",
  "amount-asc",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "transactionNumber-desc", label: "Transaction # (High–Low)" },
  { value: "transactionNumber-asc", label: "Transaction # (Low–High)" },
  { value: "amount-desc", label: "Amount (High–Low)" },
  { value: "amount-asc", label: "Amount (Low–High)" },
];

const DEFAULT_SORT: SortValue = "date-desc";

export function parseSort(raw: string | undefined) {
  const value = SORT_VALUES.includes(raw as SortValue) ? (raw as SortValue) : DEFAULT_SORT;
  const dashIndex = value.lastIndexOf("-");
  const sortBy = value.slice(0, dashIndex) as "date" | "amount" | "transactionNumber";
  const sortDir = value.slice(dashIndex + 1) as "asc" | "desc";
  return { sortBy, sortDir, sortValue: value };
}
