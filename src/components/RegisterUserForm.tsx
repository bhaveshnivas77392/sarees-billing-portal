// START GENAI
"use client";

import { useState } from "react";
import { registerUser } from "@/lib/actions/admin";

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-6).toUpperCase();
}

export function RegisterUserForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [role, setRole] = useState("STAFF");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    const result = await registerUser(formData);
    setSubmitting(false);

    if (result.ok) {
      setMessage({ type: "ok", text: "Login created. Share the email and password with them directly." });
      setPassword("");
      (document.getElementById("register-user-form") as HTMLFormElement)?.reset();
    } else {
      setMessage({ type: "error", text: result.error });
    }
  }

  return (
    <form id="register-user-form" action={handleSubmit} className="max-w-md space-y-3 rounded-lg border bg-white p-5 shadow-sm">
      <Field label="Full name" name="name" required />
      <Field label="Email" name="email" type="email" required />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
        <div className="flex gap-2">
          <input
            name="password"
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setPassword(randomPassword())}
            className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            Generate
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="STAFF">Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="OWNER">Owner</option>
        </select>
      </div>

      {role !== "OWNER" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Branch</label>
          <select name="branchId" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create login"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
      />
    </div>
  );
}
// END GENAI
