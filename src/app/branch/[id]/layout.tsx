// START GENAI
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";

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
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sarees Billing Portal"}
            </p>
            <h1 className="text-lg font-semibold text-gray-900">{branch.name}</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/branch/${id}`} className="text-gray-600 hover:text-rose-600">
              Stock
            </Link>
            <Link href={`/branch/${id}/add-stock`} className="text-gray-600 hover:text-rose-600">
              Add Stock
            </Link>
            <Link
              href={`/branch/${id}/sale`}
              className="rounded-md bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
            >
              New Sale
            </Link>
            {session.role === "OWNER" && (
              <Link href="/dashboard" className="text-gray-600 hover:text-rose-600">
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
