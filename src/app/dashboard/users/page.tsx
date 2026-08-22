// START GENAI
import { prisma } from "@/lib/prisma";
import { RegisterUserForm } from "@/components/RegisterUserForm";

export default async function UsersPage() {
  const [branches, users] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ include: { branch: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Register a new login</h2>
        <RegisterUserForm branches={branches} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Existing logins</h2>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.branch?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// END GENAI
