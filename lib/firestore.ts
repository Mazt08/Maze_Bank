/**
 * Firestore data types and server-side helpers.
 * Server-only — relies on firebase-admin.
 *
 * Note: import 'server-only' is NOT added here because this file is imported
 * by various server contexts. Instead, server-only guard is enforced via
 * firebase-admin.ts which this file depends on.
 */
import { adminDb } from "./firebase-admin";
import type { Timestamp } from "firebase-admin/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  balance: number; // stored in cents (integer) to avoid float rounding
  accountNumber: string;
  role?: "user" | "admin"; // user role (default: "user")
  isFrozen?: boolean; // account freeze status
  createdAt: Timestamp;
}

export interface TransactionDoc {
  id: string;
  fromUid: string;
  toUid: string;
  fromAccount: string;
  toAccount: string;
  amount: number; // cents
  type: "transfer" | "deposit" | "withdrawal" | "admin_adjustment";
  status: "completed" | "pending" | "failed";
  note: string;
  adminReason?: string; // reason for admin_adjustment transactions
  createdAt: Timestamp;
}

// Serialisable versions safe to pass from server → client components
export interface UserData {
  uid: string;
  name: string;
  email: string;
  balance: number;
  accountNumber: string;
  role?: "user" | "admin";
  isFrozen?: boolean;
  createdAt: string;
}

export interface TransactionData {
  id: string;
  fromUid: string;
  toUid: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  type: "transfer" | "deposit" | "withdrawal" | "admin_adjustment";
  status: "completed" | "pending" | "failed";
  note: string;
  adminReason?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert Firestore Timestamp → ISO string for safe serialisation. */
function serializeUser(doc: UserDoc): UserData {
  return {
    ...doc,
    createdAt: doc.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

function serializeTransaction(id: string, doc: Omit<TransactionDoc, "id">): TransactionData {
  return {
    ...doc,
    id,
    createdAt: doc.createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };
}

/** Fetch a user document by UID. Returns null if not found. */
export async function getUserByUid(uid: string): Promise<UserData | null> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return serializeUser(snap.data() as UserDoc);
}

/** Fetch a user document by account number. */
export async function getUserByAccountNumber(
  accountNumber: string
): Promise<UserData | null> {
  const snap = await adminDb
    .collection("users")
    .where("accountNumber", "==", accountNumber)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return serializeUser(doc.data() as UserDoc);
}

/** Fetch the N most recent transactions for a user (as sender or receiver). */
export async function getRecentTransactions(
  uid: string,
  limit = 10
): Promise<TransactionData[]> {
  // Firestore doesn't support OR queries across fields before v9.20 composite filters;
  // we run two queries and merge client-side (acceptable for small limits).
  const [sentSnap, receivedSnap] = await Promise.all([
    adminDb
      .collection("transactions")
      .where("fromUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
    adminDb
      .collection("transactions")
      .where("toUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
  ]);

  const seen = new Set<string>();
  const results: TransactionData[] = [];

  for (const doc of [...sentSnap.docs, ...receivedSnap.docs]) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);
    results.push(serializeTransaction(doc.id, doc.data() as Omit<TransactionDoc, "id">));
  }

  // Sort merged results by creation time descending
  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return results.slice(0, limit);
}

/** Generate a display account number with the Maze Bank prefix. */
export function generateAccountNumber(): string {
  return `MZB-${Math.floor(1 + Math.random() * 999_999)
    .toString()
    .padStart(6, "0")}`;
}

/** Format cents as a currency string (e.g., 150000 → "$1,500.00"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
