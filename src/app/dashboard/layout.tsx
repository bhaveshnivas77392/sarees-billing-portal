// START GENAI
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { TextilePattern } from "@/components/TextilePattern";
import { IconStore, IconUser, IconSparkles } from "@/components/Icons";

// Always reads fresh DB state - the owner dashboard must never be statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect(`/branch/${session.branchId}`);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-rose-900 to-amber-900 text-white shadow-md">
        <TextilePattern className="absolute inset-0 h-full w-full text-white/5 pointer-events-none" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl border border-white/20 shadow-sm object-cover" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-amber-200">
                {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees"}
              </p>
              <h1 className="text-base font-bold sm:text-lg">Owner Central Dashboard</h1>
            </div>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-rose-100 transition hover:bg-white/10 hover:text-white"
            >
              <IconStore className="h-4 w-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/dashboard/users"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-rose-100 transition hover:bg-white/10 hover:text-white"
            >
              <IconUser className="h-4 w-4" />
              <span className="hidden sm:inline">Register Staff</span>
            </Link>
            <Link
              href="/dashboard/audit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-rose-100 transition hover:bg-white/10 hover:text-white"
            >
              <IconSparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
            </Link>
            <div className="ml-1 border-l border-white/20 pl-2">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
// END GENAI
