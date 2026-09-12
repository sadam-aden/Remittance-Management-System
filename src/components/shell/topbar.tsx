import { Bell } from "lucide-react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Topbar({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail: string;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          {getGreeting()}, {userName ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{today} · All branches</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-card">
          <Bell size={16} className="text-text-muted" />
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-income-dim px-3 py-2 text-income sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-income" />
          <span className="text-xs">Balance syncing live</span>
        </div>
        <UserMenu name={userName} email={userEmail} />
      </div>
    </div>
  );
}
