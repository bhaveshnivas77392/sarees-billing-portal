// START GENAI
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/LogoutButton";
import { TextilePattern } from "@/components/TextilePattern";
import { BranchNavLinks } from "@/components/BranchNavLinks";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-rose-800 to-amber-800 text-white shadow-md">
        <TextilePattern className="absolute inset-0 h-full w-full text-white/5 pointer-events-none" />
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl border border-white/20 shadow-sm object-cover" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-rose-200">
                {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-base font-bold sm:text-lg">{branch.name}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BranchNavLinks branchId={id} isOwner={session.role === "OWNER"} />
            <div className="ml-1 border-l border-white/20 pl-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
// END GENAI
