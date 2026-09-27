import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getUserByUid } from "@/lib/firestore";
import Layout from "@/components/Layout";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Maze Bank",
  description: "Manage users and accounts",
};

export const dynamic = "force-dynamic";

/**
 * Admin Dashboard — server component.
 *
 * Defense-in-depth: middleware already blocked non-admins at the routing layer.
 * This component re-verifies independently so the page is safe even if
 * middleware is bypassed (e.g., direct server invocation, misconfiguration).
 */
export default async function AdminPage() {
  // Layer 2: cryptographic session verification (Admin SDK)
  const session = await getSession();
  if (!session) redirect("/login");

  // Layer 3: authoritative role check from Firestore
  const user = await getUserByUid(session.uid);
  if (!user || user.role !== "admin") {
    // Silent redirect — never expose a 403 that confirms this route exists
    redirect("/dashboard");
  }

  return (
    <Layout userName={user.name} isAdmin={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, view transactions, and adjust balances</p>
        </div>

        {/* Admin data is only rendered after server-side role verification above */}
        <AdminDashboardClient />
      </div>
    </Layout>
  );
}
