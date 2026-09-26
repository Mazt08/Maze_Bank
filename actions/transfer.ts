"use server";

/**
 * Transfer server action.
 * Executes an atomic Firestore transaction:
 *   1. Verify sender session.
 *   2. Look up recipient by account number.
 *   3. Check sender has sufficient balance.
 *   4. Debit sender, credit recipient, write transaction doc — all in one batch.
 */
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "./auth";
import { getUserByUid, getUserByAccountNumber } from "@/lib/firestore";

export interface TransferState {
  error?: string;
  success?: boolean;
}

export async function transferFunds(
  _prevState: TransferState,
  formData: FormData
): Promise<TransferState> {
  // 1. Auth check
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const toAccountNumber = (formData.get("accountNumber") as string)?.trim();
  const amountStr = (formData.get("amount") as string)?.trim();
  const note = ((formData.get("note") as string) ?? "").trim().slice(0, 200);

  // 2. Basic validation
  if (!toAccountNumber || !/^\d{10}$/.test(toAccountNumber)) {
    return { error: "Invalid account number. Must be 10 digits." };
  }

  const amountDollars = parseFloat(amountStr);
  if (isNaN(amountDollars) || amountDollars <= 0) {
    return { error: "Enter a valid positive amount." };
  }
  if (amountDollars > 10_000) {
    return { error: "Single transfer limit is $10,000." };
  }

  const amountCents = Math.round(amountDollars * 100);

  // 3. Load sender
  const sender = await getUserByUid(session.uid);
  if (!sender) return { error: "Sender account not found." };

  // 4. Prevent self-transfer
  if (sender.accountNumber === toAccountNumber) {
    return { error: "You cannot transfer to your own account." };
  }

  // 5. Load recipient
  const recipient = await getUserByAccountNumber(toAccountNumber);
  if (!recipient) return { error: "Recipient account not found." };

  // 6. Balance check
  if (sender.balance < amountCents) {
    return { error: "Insufficient funds." };
  }

  // 7. Atomic Firestore transaction
  try {
    const senderRef = adminDb.collection("users").doc(sender.uid);
    const recipientRef = adminDb.collection("users").doc(recipient.uid);
    const txRef = adminDb.collection("transactions").doc();

    await adminDb.runTransaction(async (t) => {
      const [senderSnap, recipientSnap] = await Promise.all([
        t.get(senderRef),
        t.get(recipientRef),
      ]);

      const currentSenderBalance = (senderSnap.data()?.balance ?? 0) as number;
      if (currentSenderBalance < amountCents) {
        throw new Error("Insufficient funds.");
      }

      t.update(senderRef, { balance: FieldValue.increment(-amountCents) });
      t.update(recipientRef, { balance: FieldValue.increment(amountCents) });
      t.set(txRef, {
        fromUid: sender.uid,
        toUid: recipient.uid,
        fromName: sender.name,
        toName: recipient.name,
        amount: amountCents,
        note,
        timestamp: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed.";
    return { error: message };
  }
}
