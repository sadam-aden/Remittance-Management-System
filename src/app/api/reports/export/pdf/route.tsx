import type { NextRequest } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { reportsRepository, type ReportRow, type ReportSummary } from "@/lib/repositories/reports-repository";
import { ledgerRepository } from "@/lib/repositories/ledger-repository";
import { settingsRepository } from "@/lib/repositories/settings-repository";
import { auditLogRepository } from "@/lib/repositories/audit-log-repository";
import { getClientIp } from "@/lib/get-client-ip";
import { requireApiSession } from "@/lib/require-api-session";
import { parseReportFilters } from "@/lib/report-filter-params";
import { formatMoney } from "@/lib/currency-format";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111111" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyName: { fontSize: 18, fontWeight: 700 },
  subtitle: { fontSize: 10, color: "#555555", marginTop: 3 },
  dateRange: { fontSize: 10, color: "#555555" },
  summaryRow: { flexDirection: "row", marginBottom: 16 },
  summaryCell: { flex: 1 },
  summaryLabel: { fontSize: 9, color: "#666666" },
  summaryValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#dddddd", paddingVertical: 4 },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 4,
    fontWeight: 700,
  },
  cell: { flex: 1, paddingRight: 8 },
  cellRight: { flex: 1, textAlign: "right", paddingRight: 8 },
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ReportDocument({
  companyName,
  dateFrom,
  dateTo,
  summary,
  currentBalance,
  rows,
}: {
  companyName: string;
  dateFrom: Date;
  dateTo: Date;
  summary: ReportSummary;
  currentBalance: number;
  rows: ReportRow[];
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.subtitle}>Transaction Report</Text>
          </View>
          <Text style={styles.dateRange}>
            {dateFrom.toLocaleDateString("en-US")} – {dateTo.toLocaleDateString("en-US")}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Current Balance</Text>
            <Text style={styles.summaryValue}>${currentBalance.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValue}>${summary.totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Total Sent</Text>
            <Text style={styles.summaryValue}>${summary.totalSent.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Total Profit</Text>
            <Text style={styles.summaryValue}>${summary.totalProfit.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{summary.transactionCount}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.cell}>Type</Text>
          <Text style={styles.cell}>Transaction #</Text>
          <Text style={styles.cell}>Date</Text>
          <Text style={styles.cell}>Customer</Text>
          <Text style={styles.cell}>Beneficiary</Text>
          <Text style={styles.cellRight}>Amount</Text>
          <Text style={styles.cellRight}>Fee</Text>
          <Text style={styles.cellRight}>Total</Text>
          <Text style={styles.cell}>Status</Text>
        </View>
        {rows.map((r) => (
          <View style={styles.row} key={`${r.type}-${r.id}`}>
            <Text style={styles.cell}>{capitalize(r.type)}</Text>
            <Text style={styles.cell}>{r.transactionNumber}</Text>
            <Text style={styles.cell}>{r.date.toLocaleDateString("en-US")}</Text>
            <Text style={styles.cell}>{r.customerName}</Text>
            <Text style={styles.cell}>{r.counterpartyName ?? "—"}</Text>
            <Text style={styles.cellRight}>{formatMoney(r.amount, r.currency)}</Text>
            <Text style={styles.cellRight}>{r.fee > 0 ? r.fee.toFixed(2) : "—"}</Text>
            <Text style={styles.cellRight}>{formatMoney(r.totalPaid, r.currency)}</Text>
            <Text style={styles.cell}>{capitalize(r.status)}</Text>
          </View>
        ))}
        {rows.length === 0 && (
          <View style={styles.row}>
            <Text style={styles.cell}>No transactions in this range.</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest) {
  const session = await requireApiSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const { filters } = parseReportFilters((key) => searchParams.get(key) ?? undefined);

  const [rows, summary, settings, currentBalance] = await Promise.all([
    reportsRepository.getTransactions(filters),
    reportsRepository.getSummary(filters),
    settingsRepository.get(),
    ledgerRepository.getCurrentBalance(),
  ]);

  const buffer = await renderToBuffer(
    <ReportDocument
      companyName={settings.companyName}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      summary={summary}
      currentBalance={currentBalance}
      rows={rows}
    />,
  );

  await auditLogRepository.log({
    userId: session.user.id,
    action: "export",
    tableName: "reports",
    ipAddress: await getClientIp(),
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${Date.now()}.pdf"`,
    },
  });
}
