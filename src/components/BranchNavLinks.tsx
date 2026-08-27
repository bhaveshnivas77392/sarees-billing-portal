// START GENAI
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCart, IconBox, IconPlus, IconShare, IconSparkles, IconStore } from "@/components/Icons";

export function BranchNavLinks({ branchId, isOwner }: { branchId: string; isOwner: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: `/branch/${branchId}`, label: "Inventory", icon: <IconBox className="h-4 w-4" />, exact: true },
    { href: `/branch/${branchId}/add-stock`, label: "Add Stock", icon: <IconPlus className="h-4 w-4" /> },
    { href: `/branch/${branchId}/transfer`, label: "Transfer", icon: <IconShare className="h-4 w-4" /> },
    { href: `/branch/${branchId}/returns`, label: "Exchanges", icon: <IconSparkles className="h-4 w-4" /> },
    { href: `/branch/${branchId}/day-close`, label: "Day Close", icon: <IconStore className="h-4 w-4" /> },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
      {links.map(({ href, label, icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 transition ${
              isActive
                ? "bg-white/20 text-white font-bold backdrop-blur-xs shadow-2xs"
                : "text-rose-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {icon}
            <span className="hidden md:inline">{label}</span>
          </Link>
        );
      })}

      <Link
        href={`/branch/${branchId}/sale`}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold shadow-sm transition active:scale-95 ${
          pathname.includes("/sale")
            ? "bg-amber-400 text-rose-950 ring-2 ring-amber-300"
            : "bg-white text-rose-800 hover:bg-rose-50"
        }`}
      >
        <IconCart className="h-4 w-4 text-rose-700" />
        <span>New Sale</span>
      </Link>

      {isOwner && (
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-amber-200 hover:bg-white/10 hover:text-white transition"
        >
          <span className="hidden sm:inline">Owner</span>
        </Link>
      )}
    </nav>
  );
}
// END GENAI
