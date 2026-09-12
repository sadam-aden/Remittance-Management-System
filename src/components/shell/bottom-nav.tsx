"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryTabs = [
  { icon: LayoutDashboard, name: "Dashboard", href: "/dashboard" },
  { icon: ArrowUpCircle, name: "Sent", href: "/sent" },
  { icon: ArrowDownCircle, name: "Income", href: "/income" },
  { icon: Users, name: "Customers", href: "/customers" },
];

const moreItems = [
  { icon: Receipt, name: "Receipts", href: "/receipts" },
  { icon: BarChart3, name: "Reports", href: "/reports" },
  { icon: ShieldCheck, name: "Audit Log", href: "/audit-log" },
  { icon: Settings, name: "Settings", href: "/settings" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const visibleMoreItems = isAdmin ? moreItems : moreItems.filter((item) => item.name !== "Settings");
  const isMoreActive = visibleMoreItems.some((item) => isActivePath(pathname, item.href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-hairline bg-panel pb-[env(safe-area-inset-bottom)] md:hidden">
      {primaryTabs.map((tab) => {
        const isActive = isActivePath(pathname, tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <tab.icon size={20} className={isActive ? "text-income" : "text-text-muted"} />
            <span className={`text-[11px] ${isActive ? "text-text-primary" : "text-text-muted"}`}>
              {tab.name}
            </span>
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <MoreHorizontal size={20} className={isMoreActive ? "text-income" : "text-text-muted"} />
              <span className={`text-[11px] ${isMoreActive ? "text-text-primary" : "text-text-muted"}`}>
                More
              </span>
            </button>
          }
        />
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            {visibleMoreItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ background: isActive ? "var(--color-income-dim)" : "transparent" }}
                >
                  <item.icon size={18} className={isActive ? "text-income" : "text-text-muted"} />
                  <span className={`text-sm ${isActive ? "text-text-primary" : "text-text-muted"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
            <div className="mt-2 border-t border-hairline pt-2">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sent"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
