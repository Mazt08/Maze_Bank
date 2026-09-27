import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/actions/auth";
import { getUserByUid, getRecentTransactions } from "@/lib/firestore";
import Layout from "@/components/Layout";
import Analytics from "@/components/Analytics";

const metadata = {
  title: "Spending Analytics | Maze Bank",
  description: "View your spending insights and transaction analytics",
};

export { metadata };

/**
 * Spending Analytics page — server component
 * Fetches user's transaction data and passes to client chart component
 */
export default async function AnalyticsPage() {
  // Verify session
  const session = await getSession();
  if (!session) redirect("/login");

  // Get user data
  const user = await getUserByUid(session.uid);
  if (!user) redirect("/login");

  // Fetch all transactions for this user
  const allTransactions = await adminDb
    .collection("transactions")
    .where("fromUid", "==", session.uid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const transactions = allTransactions.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Array<Record<string, any> & { id: string; createdAt: Date }>;

  // Calculate monthly spending (last 6 months)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const monthlyData: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyData[monthKey] = 0;
  }

  transactions.forEach((tx) => {
    if (tx.type === "transfer" && tx.createdAt >= sixMonthsAgo) {
      const monthKey = tx.createdAt.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      if (monthKey in monthlyData) {
        monthlyData[monthKey] += tx.amount;
      }
    }
  });

  const monthlySpending = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }));

  // Calculate sent vs received
  const totalSent = transactions
    .filter((tx) => tx.type === "transfer")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const receivedTransactions = await adminDb
    .collection("transactions")
    .where("toUid", "==", session.uid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const totalReceived = receivedTransactions.docs
    .map((doc) => doc.data())
    .filter((tx) => tx.type === "transfer")
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const sentVsReceived = [
    { name: "Sent", value: totalSent },
    { name: "Received", value: totalReceived },
  ];

  // Calculate top recipients
  const recipientMap: Record<string, { name: string; amount: number; count: number }> = {};

  for (const tx of transactions) {
    if (tx.type === "transfer" && tx.toUid) {
      const recipientSnap = await adminDb.collection("users").doc(tx.toUid).get();
      const recipientName = recipientSnap.exists
        ? (recipientSnap.data() as any).name
        : tx.toAccount;

      if (!recipientMap[tx.toUid]) {
        recipientMap[tx.toUid] = {
          name: recipientName,
          amount: 0,
          count: 0,
        };
      }
      recipientMap[tx.toUid].amount += tx.amount;
      recipientMap[tx.toUid].count += 1;
    }
  }

  const topRecipients = Object.values(recipientMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const analyticsData = {
    monthlySpending,
    sentVsReceived: sentVsReceived.filter((item) => item.value > 0),
    topRecipients,
  };

  return (
    <Layout userName={user.name} isAdmin={user.role === "admin"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Spending Analytics</h1>
          <p className="text-gray-600">View your spending patterns and transaction insights</p>
        </div>

        <Analytics data={analyticsData} />
      </div>
    </Layout>
  );
}
