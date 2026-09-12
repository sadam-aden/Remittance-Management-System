import { requireSession } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { BottomNav } from "@/components/shell/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isAdmin={session.user.role === "admin"} />
      <main className="flex w-full max-w-[1400px] flex-1 flex-col gap-6 p-6 pb-24 md:p-8 md:pb-8">
        <Topbar userName={session.user.name} userEmail={session.user.email ?? ""} />
        {children}
      </main>
      <BottomNav isAdmin={session.user.role === "admin"} />
    </div>
  );
}
