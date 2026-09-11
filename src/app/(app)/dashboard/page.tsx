import type { Metadata } from "next";
import { ledgerRepository } from "@/lib/repositories/ledger-repository";
import { dashboardRepository } from "@/lib/repositories/dashboard-repository";
import { StatCard } from "@/components/dashboard/stat-card";
import { IncomeVsSentChart } from "@/components/dashboard/income-vs-sent-chart";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { TopCustomersChart } from "@/components/dashboard/top-customers-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export const metadata: Metadata = { title: "Dashboard — Remittance Desk" };

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function DashboardPage() {
  const [balance, cards, weeklyFlow, monthlyTrend, topCustomers, recentTransactions] =
    await Promise.all([
      ledgerRepository.getCurrentBalance(),
      dashboardRepository.getCards(),
      dashboardRepository.getWeeklyFlow(),
      dashboardRepository.getMonthlyTrend(),
      dashboardRepository.getTopCustomers(),
      dashboardRepository.getRecentTransactions(),
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Current Balance"
          value={money(balance)}
          delta={`${cards.currentBalanceTransactionsToday} today`}
          positive
          tone="report"
          big
        />
        <StatCard
          label="Today's Income"
          value={money(cards.todayIncome)}
          delta={`${cards.todayIncomeCount} transfers`}
          positive
          tone="income"
        />
        <StatCard
          label="Today's Sent"
          value={money(cards.todaySent)}
          delta={`${cards.todaySentCount} transfers`}
          positive={false}
          tone="sent"
        />
        <StatCard
          label="Today's Profit"
          value={money(cards.todayProfit)}
          delta={cards.todayProfitMargin !== null ? `${cards.todayProfitMargin.toFixed(1)}% margin` : undefined}
          positive
          tone="report"
        />
        <StatCard
          label="Monthly Income"
          value={money(cards.monthlyIncome)}
          delta={
            cards.monthlyIncomeChangePct !== null
              ? `${Math.abs(cards.monthlyIncomeChangePct).toFixed(1)}% vs last month`
              : undefined
          }
          positive={(cards.monthlyIncomeChangePct ?? 0) >= 0}
          tone="income"
        />
        <StatCard
          label="Monthly Sent"
          value={money(cards.monthlySent)}
          delta={
            cards.monthlySentChangePct !== null
              ? `${Math.abs(cards.monthlySentChangePct).toFixed(1)}% vs last month`
              : undefined
          }
          positive={(cards.monthlySentChangePct ?? 0) <= 0}
          tone="sent"
        />
        <StatCard
          label="Transactions"
          value={cards.transactionCount.toLocaleString()}
          delta={`${cards.currentBalanceTransactionsToday} today`}
          positive
          tone="report"
        />
        <StatCard
          label="Customers"
          value={cards.customerCount.toLocaleString()}
          delta={`${cards.newCustomersToday} new today`}
          positive
          tone="report"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <IncomeVsSentChart data={weeklyFlow} />
        <TopCustomersChart slices={topCustomers} customerCount={cards.customerCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <MonthlyTrendChart data={monthlyTrend} />
        <RecentTransactions rows={recentTransactions} />
      </div>
    </div>
  );
}
