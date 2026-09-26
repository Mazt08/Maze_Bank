import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-dark text-white">
      {/* ── Header ── */}
      <header className="max-w-5xl mx-auto w-full px-4 py-5 flex items-center justify-between">
        <span className="text-gold font-bold text-2xl tracking-widest">
          MAZE BANK
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="text-sm px-4 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-brand-dark transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm px-4 py-2 bg-gold text-brand-dark font-semibold rounded hover:bg-gold-light transition-colors"
          >
            Open account
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-6">
        {/* Bank icon */}
        <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center ring-4 ring-gold/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-10 h-10 text-gold"
            aria-hidden="true"
          >
            <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6z" />
            <path
              fillRule="evenodd"
              d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.202 7.616.592a.75.75 0 0 1 .634.74zm-7.5 9.918V14.25a.75.75 0 0 0-1.5 0v6h1.5zm3-6.75a.75.75 0 0 0-1.5 0v6.75h1.5V13.5zm-6 .75a.75.75 0 0 0-1.5 0V20.25h1.5V14.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight max-w-2xl">
          Banking for the{" "}
          <span className="text-gold">streets of Los Santos</span>
        </h1>

        <p className="text-lg text-gray-300 max-w-xl">
          Send money, track your transactions, and manage your account — all in
          one place. Maze Bank: where your money is our business.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/register"
            className="px-8 py-3 bg-gold text-brand-dark font-bold rounded-lg text-base hover:bg-gold-light transition-colors"
          >
            Open a free account
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-white/30 text-white rounded-lg text-base hover:border-gold hover:text-gold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto w-full px-4 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: "💸",
            title: "Instant Transfers",
            body: "Send money to any Maze Bank account in seconds with no fees.",
          },
          {
            icon: "📊",
            title: "Full History",
            body: "Every transaction logged. Never lose track of where your money went.",
          },
          {
            icon: "🔒",
            title: "Secure by Default",
            body: "Session-based auth, server-only data access, and encrypted connections.",
          },
        ].map(({ icon, title, body }) => (
          <div
            key={title}
            className="bg-brand rounded-xl p-6 flex flex-col gap-3 border border-white/5"
          >
            <span className="text-3xl" role="img" aria-label={title}>
              {icon}
            </span>
            <h3 className="font-semibold text-lg text-gold">{title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Maze Bank, Ltd. All rights reserved. Member FDIC.
      </footer>
    </div>
  );
}
