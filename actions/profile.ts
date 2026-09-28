"use server";

/**
 * Profile server actions
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "./auth";

export interface ProfileActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Update user's display name in Firestore
 */
export async function updateDisplayName(
  newName: string,
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  if (!newName.trim()) {
    return { error: "Name cannot be empty." };
  }

  if (newName.length > 100) {
    return { error: "Name is too long." };
  }

  try {
    await adminDb
      .collection("users")
      .doc(session.uid)
      .update({ name: newName.trim() });

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update name.";
    return { error: message };
  }
}

/**
 * Get user profile information (read-only on server)
 */
export async function getUserProfile(): Promise<{
  error?: string;
  user?: {
    name: string;
    email: string;
    accountNumber: string;
    balance: number;
    role?: "user" | "admin";
    createdAt: string;
  };
}> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    const snap = await adminDb.collection("users").doc(session.uid).get();

    if (!snap.exists) {
      return { error: "User not found." };
    }

    const data = snap.data() as any;
    return {
      user: {
        name: data.name,
        email: data.email,
        accountNumber: data.accountNumber,
        balance: data.balance,
        role: data.role,
        createdAt:
          data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch profile.";
    return { error: message };
  }
}
