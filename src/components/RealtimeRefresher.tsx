// START GENAI
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Watch = { table: "stocks" | "sales"; filter?: string };

/**
 * Subscribes to Postgres change events on the given tables and triggers a Next.js
 * server-component refetch (router.refresh()) whenever one fires - this is what makes
 * stock counts and sales totals update live across branches/devices without polling,
 * while reusing the exact same render path as the initial page load.
 */
export function RealtimeRefresher({ watch }: { watch: Watch[] }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("live-updates");

    for (const { table, filter } of watch) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => router.refresh(),
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
// END GENAI
