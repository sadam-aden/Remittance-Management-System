import type { TransactionStatus } from "@/generated/prisma/client";

const STYLES: Record<TransactionStatus, string> = {
  completed: "bg-income-dim text-income",
  pending: "bg-report-dim text-report",
  cancelled: "bg-sent-dim text-sent",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
