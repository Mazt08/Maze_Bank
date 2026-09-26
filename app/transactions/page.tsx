/**
 * Transactions page — server component.
 * Loads all transactions (up to 100) for the current user.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getUserByUid, getRecentTransactions, formatCents } from "@/lib/firestore";
import Layout from "@/components/Layout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transactions — Maze Bank" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, transactions] = await Promise.all([
    getUserByUid(session.uid),
    getRecentTransactions(session.uid, 100),
  ]);

  if (!user) redirect("/login");

  return (
    <Layout userName={user.name}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction history
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} on record
          </p>
        </div>

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">
              No transactions yet. Your history will appear here.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Counterpart</th>
                      <th className="px-6 py-3 font-medium">Note</th>
                      <th className="px-6 py-3 font-medium text-right">
                        Amount
                      </th>
                      <th className="px-6 py-3 font-medium text-right">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((tx) => {
                      const isSender = tx.fromUid === user.uid;
                      const sign = isSender ? "-" : "+";
                      const counterpart = isSender ? tx.toName : tx.fromName;
                      const amountColor = isSender
                        ? "text-red-600"
                        : "text-green-600";
                      const date = new Date(tx.timestamp).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      );

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {date}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {counterpart}
                          </td>
                          <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                            {tx.note || <span className="italic">—</span>}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-semibold ${amountColor}`}
                          >
                            {sign}
                            {formatCents(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                isSender
                                  ? "bg-red-50 text-red-600"
                                  : "bg-green-50 text-green-700"
                              }`}
                            >
                              {isSender ? "Sent" : "Received"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <ul className="sm:hidden divide-y divide-gray-50">
                {transactions.map((tx) => {
                  const isSender = tx.fromUid === user.uid;
                  const sign = isSender ? "-" : "+";
                  const counterpart = isSender ? tx.toName : tx.fromName;
                  const amountColor = isSender
                    ? "text-red-600"
                    : "text-green-600";
                  const date = new Date(tx.timestamp).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  );

                  return (
                    <li key={tx.id} className="px-4 py-4 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {isSender ? `To ${counterpart}` : `From ${counterpart}`}
                        </span>
                        {tx.note && (
                          <span className="text-xs text-gray-400 truncate">
                            {tx.note}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${amountColor}`}>
                        {sign}
                        {formatCents(tx.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
