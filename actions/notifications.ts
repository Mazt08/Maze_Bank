"use server";

/**
 * Notification server actions
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "./auth";

export interface NotificationDoc {
  message: string;
  read: boolean;
  createdAt: any;
  type?: "transfer_received" | "large_debit" | "admin_action";
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  uid: string,
  message: string,
  type: "transfer_received" | "large_debit" | "admin_action" = "transfer_received"
): Promise<{ error?: string; success?: boolean }> {
  try {
    const notificationsRef = adminDb.collection("notifications").doc(uid).collection("items");
    await notificationsRef.add({
      message,
      type,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create notification.";
    return { error: message };
  }
}

/**
 * Get recent notifications for the current user
 */
export async function getNotifications(
  limit = 10
): Promise<{ error?: string; notifications?: any[] }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    const snap = await adminDb
      .collection("notifications")
      .doc(session.uid)
      .collection("items")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const notifications = snap.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    return { notifications };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications.";
    return { error: message };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{ error?: string; count?: number }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    const snap = await adminDb
      .collection("notifications")
      .doc(session.uid)
      .collection("items")
      .where("read", "==", false)
      .count()
      .get();

    return { count: snap.data().count };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch count.";
    return { error: message };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  try {
    const batch = adminDb.batch();
    const snap = await adminDb
      .collection("notifications")
      .doc(session.uid)
      .collection("items")
      .where("read", "==", false)
      .get();

    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark as read.";
    return { error: message };
  }
}
