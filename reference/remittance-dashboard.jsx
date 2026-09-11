import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle, Receipt,
  BarChart3, ShieldCheck, Settings, Search, Bell, Wallet,
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`;

const COLORS = {
  void: "#0A0E12",
  panel: "#10151B",
  card: "#141A21",
  hairline: "#1F2830",
  textPrimary: "#EDF2F6",
  textMuted: "#7E8C98",
  income: "#2FBF71",
  incomeDim: "rgba(47,191,113,0.14)",
  sent: "#F0453A",
  sentDim: "rgba(240,69,58,0.14)",
  report: "#3E8EF7",
  reportDim: "rgba(62,142,247,0.14)",
};

const weeklyFlow = [
  { day: "Mon", income: 6200, sent: 4800 },
  { day: "Tue", income: 8100, sent: 6650 },
  { day: "Wed", income: 5400, sent: 3900 },
  { day: "Thu", income: 9600, sent: 8700 },
  { day: "Fri", income: 8900, sent: 6200 },
  { day: "Sat", income: 5100, sent: 3300 },
  { day: "Sun", income: 3200, sent: 2100 },
];

const monthlyTrend = [
  { month: "Apr", income: 142000, sent: 118000 },
  { month: "May", income: 156000, sent: 129000 },
  { month: "Jun", income: 149000, sent: 121000 },
  { month: "Jul", income: 168000, sent: 138000 },
  { month: "Aug", income: 177000, sent: 144000 },
  { month: "Sep", income: 184300, sent: 151760 },
];

const topCustomers = [
  { name: "Amara Okafor", value: 32, color: "#2FBF71" },
  { name: "Diego Ruiz", value: 24, color: "#3E8EF7" },
  { name: "Fatima Noor", value: 19, color: "#F0453A" },
  { name: "Liu Wei", value: 14, color: "#E8B93E" },
  { name: "Others", value: 11, color: "#3A4550" },
];

const recentTx = [
  { id: "SNT-10482", who: "Diego Ruiz", type: "sent", amount: 1250, status: "Completed" },
  { id: "INC-10481", who: "Amara Okafor", type: "income", amount: 3400, status: "Completed" },
  { id: "SNT-10480", who: "Fatima Noor", type: "sent", amount: 640, status: "Pending" },
  { id: "INC-10479", who: "Liu Wei", type: "income", amount: 980, status: "Completed" },
  { id: "SNT-10478", who: "James Boateng", type: "sent", amount: 2100, status: "Completed" },
];

function StatCard({ label, value, delta, positive, tone, big }) {
  const toneColor = tone === "income" ? COLORS.income : tone === "sent" ? COLORS.sent : tone === "report" ? COLORS.report : COLORS.textPrimary;
  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between ${big ? "col-span-2" : ""}`}
      style={{ background: COLORS.card, borderColor: COLORS.hairline }}
    >
      <span className="text-[13px]" style={{ color: COLORS.textMuted, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {label}
      </span>
      <div className="flex items-end justify-between mt-3">
        <span
          className={big ? "text-[38px]" : "text-[26px]"}
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1 }}
        >
          {value}
        </span>
        {delta && (
          <span
            className="text-xs mb-1 flex items-center gap-1"
            style={{ color: positive ? COLORS.income : COLORS.sent, fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {positive ? "▲" : "▼"} {delta}
          </span>
        )}
      </div>
      <div className="h-[3px] rounded-full mt-4 w-full" style={{ background: COLORS.hairline }}>
        <div className="h-[3px] rounded-full" style={{ width: "58%", background: toneColor }} />
      </div>
    </div>
  );
}

const navSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, name: "Dashboard", active: true },
      { icon: Users, name: "Customers", badge: "128" },
      { icon: ArrowDownCircle, name: "Income" },
      { icon: ArrowUpCircle, name: "Sent Money" },
      { icon: Receipt, name: "Receipts" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, name: "Reports" },
      { icon: ShieldCheck, name: "Audit Log" },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, name: "Settings" }],
  },
];

export default function RemittanceDashboard() {
  const [range, setRange] = useState("6M");

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: COLORS.void, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      {/* Sidebar */}
      <aside
        className="w-[248px] shrink-0 border-r px-4 py-6 hidden md:flex flex-col gap-8"
        style={{ borderColor: COLORS.hairline, background: COLORS.panel }}
      >
        <div className="flex items-center gap-2 px-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: COLORS.income }}
          >
            <Wallet size={18} color="#0A0E12" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: COLORS.textPrimary }}>
            Remitly Desk
          </span>
        </div>

        {navSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <span
              className="text-[11px] tracking-wide px-2 mb-1"
              style={{ color: COLORS.textMuted }}
            >
              {section.label.toUpperCase()}
            </span>
            {section.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer"
                style={{
                  background: item.active ? COLORS.incomeDim : "transparent",
                  color: item.active ? COLORS.income : COLORS.textMuted,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={17} />
                  <span className="text-sm" style={{ color: item.active ? COLORS.textPrimary : COLORS.textMuted }}>
                    {item.name}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded-full"
                    style={{ background: COLORS.hairline, color: COLORS.textMuted }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-2xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary }}
            >
              Good morning, Admin
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
              Sunday, 6 September 2026 · All branches
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full border"
              style={{ borderColor: COLORS.hairline, background: COLORS.card, color: COLORS.textMuted }}
            >
              <Search size={15} />
              <span className="text-sm">Search transactions…</span>
            </div>
            <div
              className="w-9 h-9 rounded-full border flex items-center justify-center"
              style={{ borderColor: COLORS.hairline, background: COLORS.card }}
            >
              <Bell size={16} color={COLORS.textMuted} />
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ background: COLORS.incomeDim, color: COLORS.income }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.income }} />
              <span className="text-xs">Balance syncing live</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Current Balance" value="$128,450" delta="4.1% this week" positive tone="report" big />
          <StatCard label="Today's Income" value="$8,240" delta="12 transfers" positive tone="income" />
          <StatCard label="Today's Sent" value="$6,120" delta="9 transfers" positive={false} tone="sent" />
          <StatCard label="Today's Profit" value="$1,140" delta="0.6% margin" positive tone="report" />
          <StatCard label="Monthly Income" value="$184,300" delta="7.2% vs Aug" positive tone="income" />
          <StatCard label="Monthly Sent" value="$151,760" delta="4.9% vs Aug" positive={false} tone="sent" />
          <StatCard label="Transactions" value="342" delta="18 today" positive tone="report" />
          <StatCard label="Customers" value="128" delta="3 new today" positive tone="report" />
        </div>

        {/* Row: weekly bar + top customers */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr,1fr] gap-6">
          <div className="rounded-2xl border p-6" style={{ background: COLORS.card, borderColor: COLORS.hairline }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary }}>
                  Income vs Sent
                </h2>
                <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>This week, by day</p>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: COLORS.textMuted }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.income }} /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.sent }} /> Sent
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyFlow} barGap={6}>
                <CartesianGrid vertical={false} stroke={COLORS.hairline} />
                <XAxis dataKey="day" stroke={COLORS.textMuted} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={COLORS.textMuted} tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip
                  contentStyle={{ background: COLORS.panel, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: COLORS.textPrimary }}
                />
                <Bar dataKey="income" fill={COLORS.income} radius={[6, 6, 0, 0]} />
                <Bar dataKey="sent" fill={COLORS.sent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-6 flex flex-col" style={{ background: COLORS.card, borderColor: COLORS.hairline }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary }}>
              Top Customers
            </h2>
            <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>Share of monthly volume</p>
            <div className="flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={topCustomers} dataKey="value" innerRadius={62} outerRadius={86} paddingAngle={2} stroke="none">
                    {topCustomers.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: COLORS.textPrimary }}>
                  128
                </span>
                <span className="text-xs" style={{ color: COLORS.textMuted }}>customers</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {topCustomers.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2" style={{ color: COLORS.textMuted }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span style={{ color: COLORS.textPrimary }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row: monthly trend + recent transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr,1fr] gap-6">
          <div className="rounded-2xl border p-6" style={{ background: COLORS.card, borderColor: COLORS.hairline }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary }}>
                  Monthly Trend
                </h2>
                <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>Income and sent volume</p>
              </div>
              <div className="flex rounded-full border overflow-hidden text-xs" style={{ borderColor: COLORS.hairline }}>
                {["3M", "6M", "12M"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="px-3 py-1.5"
                    style={{
                      background: range === r ? COLORS.reportDim : "transparent",
                      color: range === r ? COLORS.report : COLORS.textMuted,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid vertical={false} stroke={COLORS.hairline} />
                <XAxis dataKey="month" stroke={COLORS.textMuted} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={COLORS.textMuted} tickLine={false} axisLine={false} fontSize={12} width={50} />
                <Tooltip
                  contentStyle={{ background: COLORS.panel, border: `1px solid ${COLORS.hairline}`, borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: COLORS.textPrimary }}
                />
                <Line type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sent" stroke={COLORS.sent} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-6" style={{ background: COLORS.card, borderColor: COLORS.hairline }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: COLORS.textPrimary }}>
              Recent Transactions
            </h2>
            <p className="text-sm mt-1 mb-4" style={{ color: COLORS.textMuted }}>Latest activity</p>
            <div className="flex flex-col gap-3">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: t.type === "income" ? COLORS.incomeDim : COLORS.sentDim }}
                    >
                      {t.type === "income" ? (
                        <ArrowDownCircle size={15} color={COLORS.income} />
                      ) : (
                        <ArrowUpCircle size={15} color={COLORS.sent} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm" style={{ color: COLORS.textPrimary }}>{t.who}</span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>{t.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: t.type === "income" ? COLORS.income : COLORS.sent }}
                    >
                      {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: t.status === "Completed" ? COLORS.textMuted : "#E8B93E" }}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
