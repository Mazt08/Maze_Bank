import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in — Maze Bank" };

// Never statically prerender — the client Firebase SDK requires browser env vars.
export const dynamic = "force-dynamic";

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your account
          </p>
        </div>

        <AuthForm mode="login" />

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand font-medium hover:underline"
          >
            Open one free
          </Link>
        </p>
      </div>
    </div>
  );
}
