// START GENAI
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { TextilePattern } from "@/components/TextilePattern";

// Always reads fresh DB state - branch pages must never be statically cached.
export const dynamic = "force-dynamic";

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) notFound();

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
              <h1 className="text-lg font-semibold">{branch.name}</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/branch/${id}`} className="text-rose-50 hover:text-white">
              Stock
            </Link>
            <Link href={`/branch/${id}/add-stock`} className="text-rose-50 hover:text-white">
              Add Stock
            </Link>
            <Link
              href={`/branch/${id}/sale`}
              className="rounded-md bg-white px-3 py-1.5 font-medium text-rose-700 shadow hover:bg-rose-50"
            >
              New Sale
            </Link>
            {session.role === "OWNER" && (
              <Link href="/dashboard" className="text-rose-50 hover:text-white">
                Dashboard
              </Link>
            )}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
// END GENAI
