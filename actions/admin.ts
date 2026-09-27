"use server";

/**
 * Admin server actions for user management.
 * All actions verify that the caller has role === "admin".
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "./auth";
import { getUserByUid } from "@/lib/firestore";

export interface AdminActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Verify that the session user has admin role.
 * Treats missing, undefined, or any non-"admin" role value as unauthorized.
 * Called at the top of every admin action — never trust the client.
 */
async function verifyAdminRole(): Promise<{ error?: string; adminUid?: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const admin = await getUserByUid(session.uid);
  // Explicit equality check: only the string "admin" passes
  if (!admin || admin.role !== "admin") {
    return { error: "Not authorized. Admin role required." };
  }

  return { adminUid: session.uid };
}

/**
 * Fetch all users (paginated).
 */
export async function getAllUsers(
  limit = 50,
  offset = 0
): Promise<{ error?: string; users?: any[]; total?: number }> {
  const verify = await verifyAdminRole();
  if (verify.error) return { error: verify.error };

  try {
    const snap = await adminDb
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const users = snap.docs.map((doc) => ({
      ...doc.data(),
      uid: doc.id,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    // Get total count (for pagination UI)
    const countSnap = await adminDb.collection("users").count().get();
    const total = countSnap.data().count;

    return { users, total };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch users.";
    return { error: message };
  }
}

/**
 * Search users by name or account number.
 */
export async function searchUsers(
  query: string
): Promise<{ error?: string; users?: any[] }> {
  const verify = await verifyAdminRole();
  if (verify.error) return { error: verify.error };

  if (!query.trim()) return { users: [] };

  try {
    const lowerQuery = query.toLowerCase();

    // Search by account number (exact prefix match)
    const byAccountSnap = await adminDb
      .collection("users")
      .where("accountNumber", ">=", query.toUpperCase())
      .where("accountNumber", "<", query.toUpperCase() + "\uf8ff")
      .get();

    const byAccount = byAccountSnap.docs.map((doc) => ({
      ...doc.data(),
      uid: doc.id,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    // Search by name (client-side filter after fetching)
    const allUsersSnap = await adminDb.collection("users").get();
    const byName = allUsersSnap.docs
      .filter((doc) => doc.data().name?.toLowerCase().includes(lowerQuery))
      .map((doc) => ({
        ...doc.data(),
        uid: doc.id,
        createdAt: doc.data().createdAt?.toDate().toISOString(),
      }));

    // Combine and deduplicate
    const seen = new Set<string>();
    const results = [];
    for (const user of [...byAccount, ...byName]) {
      if (!seen.has(user.uid)) {
        seen.add(user.uid);
        results.push(user);
      }
    }

    return { users: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return { error: message };
  }
}

/**
 * Credit or debit a user's balance (admin adjustment).
 */
export async function creditDebitUser(
  targetUid: string,
  amountCents: number,
  reason: string
): Promise<AdminActionResult> {
  const verify = await verifyAdminRole();
  if (verify.error) return { error: verify.error };

  if (!targetUid || !reason.trim()) {
    return { error: "Missing required fields." };
  }

  if (amountCents === 0) {
    return { error: "Amount must be non-zero." };
  }

  try {
    const userRef = adminDb.collection("users").doc(targetUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return { error: "User not found." };
    }

    const user = userSnap.data()!;
    const newBalance = Math.max(0, (user.balance ?? 0) + amountCents);

    // Create transaction record
    const txRef = adminDb.collection("transactions").doc();

    await adminDb.runTransaction(async (t) => {
      t.update(userRef, { balance: newBalance });
      t.set(txRef, {
        fromUid: verify.adminUid,
        toUid: targetUid,
        fromAccount: "ADMIN",
        toAccount: user.accountNumber,
        amount: Math.abs(amountCents),
        type: "admin_adjustment",
        status: "completed",
        note: reason,
        adminReason: reason,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Adjustment failed.";
    return { error: message };
  }
}

/**
 * Freeze or unfreeze a user account.
 */
export async function toggleUserFreeze(
  targetUid: string,
  isFrozen: boolean
): Promise<AdminActionResult> {
  const verify = await verifyAdminRole();
  if (verify.error) return { error: verify.error };

  if (!targetUid) {
    return { error: "User ID required." };
  }

  try {
    const userRef = adminDb.collection("users").doc(targetUid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return { error: "User not found." };
    }

    await userRef.update({ isFrozen });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update freeze status.";
    return { error: message };
  }
}
