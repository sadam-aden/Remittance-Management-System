import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { reportsRepository } from "@/lib/repositories/reports-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { getClientIp } from "@/lib/get-client-ip";
import { requireApiSession } from "@/lib/require-api-session";
import { parseReportFilters } from "@/lib/report-filter-params";

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const { filters } = parseReportFilters((key) => searchParams.get(key) ?? undefined);
  const rows = await reportsRepository.getTransactions(filters);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");
  sheet.columns = [
    { header: "Type", key: "type", width: 10 },
    { header: "Transaction #", key: "transactionNumber", width: 16 },
    { header: "Date", key: "date", width: 12 },
    { header: "Customer", key: "customerName", width: 20 },
    { header: "Beneficiary", key: "counterpartyName", width: 20 },
    { header: "Amount", key: "amount", width: 14 },
    { header: "Fee", key: "fee", width: 10 },
    { header: "Total", key: "totalPaid", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Status", key: "status", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of rows) {
    sheet.addRow({
      type: r.type,
      transactionNumber: r.transactionNumber,
      date: r.date.toISOString().slice(0, 10),
      customerName: r.customerName,
      counterpartyName: r.counterpartyName ?? "",
      amount: r.amount,
      fee: r.fee,
      totalPaid: r.totalPaid,
      currency: r.currency,
      paymentMethod: r.paymentMethod,
      status: r.status,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  await auditLogRepository.log({
    userId: session.user.id,
    action: "export",
    tableName: "reports",
    ipAddress: await getClientIp(),
  });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${Date.now()}.xlsx"`,
    },
  });
}
