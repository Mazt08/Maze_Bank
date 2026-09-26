/**
 * Transfer page — server component wrapper.
 * The actual form is a client component so it can use useFormState.
 */
import { redirect } from "next/navigation";
import { getSession } from "@/actions/auth";
import { getUserByUid, formatCents } from "@/lib/firestore";
import Layout from "@/components/Layout";
import TransferForm from "@/components/TransferForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Transfer — Maze Bank" };
export const dynamic = "force-dynamic";

export default async function TransferPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserByUid(session.uid);
  if (!user) redirect("/login");

  return (
    <Layout userName={user.name}>
      <div className="max-w-lg mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send money</h1>
          <p className="text-sm text-gray-500 mt-1">
            Transfer funds to any Maze Bank account instantly.
          </p>
        </div>

        {/* Balance indicator */}
        <div className="bg-brand rounded-xl px-5 py-4 flex items-center justify-between text-white">
          <span className="text-sm text-gray-300">Available balance</span>
          <span className="text-xl font-bold text-gold">
            {formatCents(user.balance)}
          </span>
        </div>

        <TransferForm />
      </div>
    </Layout>
  );
}
