/**
 * Dashboard — server component.
 * Reads session, fetches user doc + recent transactions from Firestore.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/actions/auth";
import { getUserByUid, getRecentTransactions, formatCents } from "@/lib/firestore";
import Layout from "@/components/Layout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard — Maze Bank" };

// Revalidate on every request so balance is always fresh
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, transactions] = await Promise.all([
    getUserByUid(session.uid),
    getRecentTransactions(session.uid, 5),
  ]);

  if (!user) redirect("/login");

  return (
    <Layout userName={user.name}>
      <div className="flex flex-col gap-8">
        {/* ── Welcome ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good day, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>

        {/* ── Cards row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Balance */}
          <div className="bg-brand rounded-2xl p-6 text-white flex flex-col gap-2 shadow-md">
            <p className="text-sm text-gray-300 uppercase tracking-wider">
              Available balance
            </p>
            <p className="text-4xl font-bold tracking-tight text-gold">
              {formatCents(user.balance)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Account #{user.accountNumber}
            </p>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Quick actions
            </p>
            <Link
              href="/transfer"
              className="flex items-center gap-3 p-3 rounded-xl bg-brand/5 hover:bg-brand/10 transition-colors"
            >
              <span className="text-xl" aria-hidden="true">💸</span>
              <span className="text-sm font-medium text-brand">
                Send money
              </span>
            </Link>
            <Link
              href="/transactions"
              className="flex items-center gap-3 p-3 rounded-xl bg-brand/5 hover:bg-brand/10 transition-colors"
            >
              <span className="text-xl" aria-hidden="true">📋</span>
              <span className="text-sm font-medium text-brand">
                View all transactions
              </span>
            </Link>
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Recent activity
            </h2>
            <Link
              href="/transactions"
              className="text-sm text-brand hover:underline"
            >
              See all
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No transactions yet. Make your first transfer!
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const isSender = tx.fromUid === user.uid;
                const sign = isSender ? "-" : "+";
                const counterpart = isSender ? tx.toAccount : tx.fromAccount;
                const amountColor = isSender
                  ? "text-red-600"
                  : "text-green-600";
                const date = new Date(tx.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );

                return (
                  <li
                    key={tx.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {isSender ? `To ${counterpart}` : `From ${counterpart}`}
                      </span>
                      {tx.note && (
                        <span className="text-xs text-gray-400 truncate max-w-xs">
                          {tx.note}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                    <span className={`text-sm font-semibold ${amountColor}`}>
                      {sign}
                      {formatCents(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
