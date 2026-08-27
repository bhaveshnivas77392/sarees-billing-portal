// START GENAI
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TextilePattern } from "@/components/TextilePattern";
import { Spinner } from "@/components/Spinner";
import { IconSparkles } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setError(error?.message ?? "Invalid email or password");
      setLoading(false);
      return;
    }

    const role = data.user.app_metadata?.role;
    const branchId = data.user.app_metadata?.branchId;
    const destination = role === "OWNER" ? "/dashboard" : `/branch/${branchId}`;

    router.push(destination);
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-950 via-rose-900 to-amber-950 px-4 py-12">
      <TextilePattern className="absolute inset-0 h-full w-full text-white/5 pointer-events-none" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/saree-logo.png"
              alt="Shop Logo"
              className="mx-auto mb-4 h-24 w-24 rounded-2xl border-2 border-rose-100 object-cover shadow-md"
            />
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 mb-1">
              <IconSparkles className="h-3.5 w-3.5 text-amber-600" /> Multi-Branch Portal
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
              {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees"}
            </h1>
            <p className="mt-1 text-xs text-gray-500">Sign in to your branch billing terminal</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@sarees.com"
                className="w-full rounded-xl border border-gray-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {loading && <Spinner />}
              {loading ? "Signing in..." : "Sign In to Terminal"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
// END GENAI
