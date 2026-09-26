import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Open an account — Maze Bank" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <span className="text-brand font-bold text-2xl tracking-widest">
              MAZE BANK
            </span>
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">
            Open an account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Free to join. No hidden fees.
          </p>
        </div>

        <AuthForm mode="register" />

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
