// START GENAI
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { TextilePattern } from "@/components/TextilePattern";

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
      setError(error?.message ?? "Sign in failed");
      setLoading(false);
      return;
    }

    // Go straight to the final destination instead of bouncing through "/" and letting
    // the proxy redirect a second time - one less round trip on an already-slow first load.
    const role = data.user.app_metadata?.role;
    const branchId = data.user.app_metadata?.branchId;
    const destination = role === "OWNER" ? "/dashboard" : `/branch/${branchId}`;

    router.push(destination);
    router.refresh();
    // Intentionally leave loading=true - the spinner stays visible until this component
    // unmounts on navigation, instead of flicking off right as the slow part begins.
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-700 via-rose-600 to-amber-600 px-4">
      <TextilePattern className="absolute inset-0 h-full w-full text-rose-100" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-rose-300/20 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="mx-auto mb-3 h-14 w-14 rounded-xl shadow-md" />
          <h1 className="text-2xl font-semibold text-rose-900">
            {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-700 disabled:opacity-70"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
// END GENAI
