"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  Wallet,
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, name: "Dashboard", href: "/dashboard" },
      { icon: Users, name: "Customers", href: "/customers" },
      { icon: ArrowDownCircle, name: "Income", href: "/income" },
      { icon: ArrowUpCircle, name: "Sent Money", href: "/sent" },
      { icon: Receipt, name: "Receipts", href: "/receipts" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, name: "Reports", href: "/reports" },
      { icon: ShieldCheck, name: "Audit Log", href: "/audit-log" },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, name: "Settings", href: "/settings" }],
  },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const visibleSections = isAdmin
    ? navSections
    : navSections.filter((section) => section.label !== "System");

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col gap-8 border-r border-hairline bg-panel px-4 py-6 md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-income">
          <Wallet size={18} className="text-void" />
        </div>
        <span className="font-display font-bold text-text-primary">Remittance Desk</span>
      </Link>

      {visibleSections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <span className="mb-1 px-2 text-[11px] tracking-wide text-text-muted">
            {section.label.toUpperCase()}
          </span>
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors"
                style={{ background: isActive ? "var(--color-income-dim)" : "transparent" }}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={17} className={isActive ? "text-income" : "text-text-muted"} />
                  <span className={`text-sm ${isActive ? "text-text-primary" : "text-text-muted"}`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
