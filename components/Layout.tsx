/**
 * Shared authenticated layout — top nav + content wrapper.
 * Rendered as a server component; logout button calls clearSession action.
 */
import Link from "next/link";
import { clearSession } from "@/actions/auth";

interface Props {
  children: React.ReactNode;
  userName?: string;
}

export default function Layout({ children, userName }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Navbar ── */}
      <header className="bg-brand sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-gold font-bold text-xl tracking-wide">
              MAZE BANK
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-white">
            <Link
              href="/dashboard"
              className="hover:text-gold transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/transfer"
              className="hover:text-gold transition-colors"
            >
              Transfer
            </Link>
            <Link
              href="/transactions"
              className="hover:text-gold transition-colors"
            >
              Transactions
            </Link>
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-4">
            {userName && (
              <span className="hidden sm:block text-sm text-gray-300">
                {userName}
              </span>
            )}
            <form action={clearSession}>
              <button
                type="submit"
                className="text-sm bg-brand-light hover:bg-gold hover:text-brand-dark text-white px-3 py-1.5 rounded transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-brand-dark text-gray-500 text-xs text-center py-4">
        © {new Date().getFullYear()} Maze Bank, Ltd. Member FDIC.
      </footer>
    </div>
  );
}
