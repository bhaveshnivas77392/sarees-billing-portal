// START GENAI
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { TextilePattern } from "@/components/TextilePattern";

// Always reads fresh DB state - the owner dashboard must never be statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect(`/branch/${session.branchId}`);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white shadow-sm">
        <TextilePattern className="absolute inset-0 h-full w-full text-white/10" />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-lg shadow" />
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-100">
                {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sarees Billing Portal"}
              </p>
              <h1 className="text-lg font-semibold">Owner Dashboard</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-rose-50 hover:text-white">
              Overview
            </Link>
            <Link href="/dashboard/users" className="text-rose-50 hover:text-white">
              Register User
            </Link>
            <Link href="/dashboard/audit" className="text-rose-50 hover:text-white">
              Login Activity
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
// END GENAI
