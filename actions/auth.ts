"use server";

/**
 * Auth server actions.
 * - setSession: verify ID token server-side, write HttpOnly cookie.
 * - clearSession: delete the session cookie (logout).
 * - registerUser: create Firestore user doc after Firebase Auth registration.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { generateAccountNumber } from "@/lib/firestore";
import { FieldValue } from "firebase-admin/firestore";

// 5-day session cookie lifetime (ms for cookies API, seconds for Firebase)
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000;
const SESSION_DURATION_S = 60 * 60 * 24 * 5;

/**
 * Exchange a Firebase ID token for a session cookie.
 * Called from the login/register client components after signInWithEmailAndPassword.
 */
export async function setSession(idToken: string): Promise<{ error?: string }> {
  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    cookies().set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_S,
    });

    return {};
  } catch {
    return { error: "Failed to create session. Please try again." };
  }
}

/**
 * Delete the session cookie and redirect to home.
 */
export async function clearSession(): Promise<void> {
  cookies().delete("__session");
  redirect("/");
}

/**
 * Verify the current session cookie and return the decoded claims.
 * Returns null if the session is missing or invalid.
 */
export async function getSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

/**
 * Create the Firestore user document after registration.
 * Called server-side once the Firebase Auth user exists.
 */
export async function registerUser(
  uid: string,
  name: string,
  email: string
): Promise<{ error?: string }> {
  try {
    const accountNumber = generateAccountNumber();
    await adminDb
      .collection("users")
      .doc(uid)
      .set({
        uid,
        name,
        email,
        balance: 500_000, // $5,000.00 welcome credit in cents
        accountNumber,
        role: "user" as const, // default role — admins are promoted manually
        createdAt: FieldValue.serverTimestamp(),
      });
    return {};
  } catch {
    return { error: "Failed to create user record. Please contact support." };
  }
}
