export const REPORT_PERIODS = ["today", "week", "month", "year", "custom"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Daily",
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
  custom: "Custom",
};

export function isReportPeriod(value: string | undefined): value is ReportPeriod {
  return !!value && (REPORT_PERIODS as readonly string[]).includes(value);
}

/** Resolves a period preset (or explicit custom dates) into a concrete [from, to] range. */
export function getPeriodRange(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string,
): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      return { from: startOfToday, to: endOfToday };
    case "week": {
      const day = startOfToday.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(startOfToday);
      monday.setDate(monday.getDate() - diffToMonday);
      return { from: monday, to: endOfToday };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfToday };
    case "custom": {
      const from = customFrom ? new Date(customFrom) : startOfToday;
      const to = customTo ? new Date(customTo) : endOfToday;
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
  }
}
