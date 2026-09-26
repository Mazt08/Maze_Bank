/**
 * Firestore data types and server-side helpers.
 * Server-only — relies on firebase-admin.
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
  createdAt: Timestamp;
}

export interface TransactionDoc {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  amount: number; // cents
  note: string;
  timestamp: Timestamp;
}

// Serialisable versions safe to pass from server → client components
export interface UserData {
  uid: string;
  name: string;
  email: string;
  balance: number;
  accountNumber: string;
  createdAt: string;
}

export interface TransactionData {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  amount: number;
  note: string;
  timestamp: string;
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
    timestamp: doc.timestamp?.toDate().toISOString() ?? new Date().toISOString(),
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
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get(),
    adminDb
      .collection("transactions")
      .where("toUid", "==", uid)
      .orderBy("timestamp", "desc")
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

  // Sort merged results by timestamp descending
  results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return results.slice(0, limit);
}

/** Generate a random 10-digit account number. */
export function generateAccountNumber(): string {
  return Math.floor(1_000_000_000 + Math.random() * 9_000_000_000).toString();
}

/** Format cents as a currency string (e.g., 150000 → "$1,500.00"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
