import type { NextRequest } from "next/server";
import { reportsRepository } from "@/lib/repositories/reports-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { getClientIp } from "@/lib/get-client-ip";
import { requireApiSession } from "@/lib/require-api-session";
import { parseReportFilters } from "@/lib/report-filter-params";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/["\n,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const { filters } = parseReportFilters((key) => searchParams.get(key) ?? undefined);
  const rows = await reportsRepository.getTransactions(filters);

  const header = [
    "Type",
    "Transaction #",
    "Date",
    "Customer",
    "Beneficiary",
    "Amount",
    "Fee",
    "Total",
    "Currency",
    "Payment Method",
    "Status",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.type,
        r.transactionNumber,
        r.date.toISOString().slice(0, 10),
        r.customerName,
        r.counterpartyName ?? "",
        r.amount.toFixed(2),
        r.fee.toFixed(2),
        r.totalPaid.toFixed(2),
        r.currency,
        r.paymentMethod,
        r.status,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  const csv = lines.join("\n");

  await auditLogRepository.log({
    userId: session.user.id,
    action: "export",
    tableName: "reports",
    ipAddress: await getClientIp(),
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${Date.now()}.csv"`,
    },
  });
}
