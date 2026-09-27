/**
 * Client-safe utility functions
 * These can be imported by client components without triggering server-only modules
 */

/**
 * Format cents as a currency string (e.g., 150000 → "$1,500.00").
 * This is a pure function with no Firestore or firebase-admin dependencies.
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
