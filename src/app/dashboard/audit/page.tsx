// START GENAI
import { prisma } from "@/lib/prisma";

type AuditRow = {
  createdAt: Date;
  ipAddress: string | null;
  action: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  branchName: string | null;
};

export default async function AuditPage() {
  // Supabase's own auth service already logs every login in auth.audit_log_entries,
  // so this reuses that instead of introducing a parallel table to keep in sync.
  const rows = await prisma.$queryRaw<AuditRow[]>`
    SELECT
      al.created_at AS "createdAt",
      al.ip_address AS "ipAddress",
      al.payload->>'action' AS action,
      u.email,
      u.name,
      u.role,
      b.name AS "branchName"
    FROM auth.audit_log_entries al
    LEFT JOIN public.users u ON u.id = (al.payload->>'actor_id')
    LEFT JOIN public.branches b ON b.id = u.branch_id
    WHERE al.payload->>'action' = 'login'
    ORDER BY al.created_at DESC
    LIMIT 100
  `;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent login activity</h2>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Branch</th>
              <th className="px-4 py-2">IP address</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-gray-600">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{r.name ?? "Unknown"}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                <td className="px-4 py-2">{r.role ?? "—"}</td>
                <td className="px-4 py-2">{r.branchName ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No login activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// END GENAI
