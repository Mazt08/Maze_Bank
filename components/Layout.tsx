/**
 * Shared authenticated layout — top nav + content wrapper.
 * Rendered as a server component; logout button calls clearSession action.
 * Includes MazeBot chatbot widget and notification bell for all authenticated users.
 *
 * The isAdmin prop is set by the parent server component after it has verified
 * the session and read role from Firestore. The admin nav link is never rendered
 * for regular users — no client-side toggle, no JS-gated visibility.
 */
import Link from "next/link";
import { clearSession } from "@/actions/auth";
import MazeBot from "@/components/MazeBot";
import NotificationBell from "@/components/NotificationBell";

interface Props {
  children: React.ReactNode;
  userName?: string;
  /** Only true when the parent server component has confirmed role === "admin". */
  isAdmin?: boolean;
}

export default function Layout({ children, userName, isAdmin = false }: Props) {
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
            <Link href="/dashboard" className="hover:text-gold transition-colors">
              Dashboard
            </Link>
            <Link href="/transfer" className="hover:text-gold transition-colors">
              Transfer
            </Link>
            <Link href="/transactions" className="hover:text-gold transition-colors">
              Transactions
            </Link>
            <Link href="/analytics" className="hover:text-gold transition-colors">
              Analytics
            </Link>
            <Link href="/profile" className="hover:text-gold transition-colors">
              Profile
            </Link>
            {/* Admin link — only rendered after server-side role verification */}
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:text-gold transition-colors text-yellow-300 font-semibold"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User + Notifications + logout */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

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

      {/* ── MazeBot Chat Widget ── */}
      <MazeBot />
    </div>
  );
}
