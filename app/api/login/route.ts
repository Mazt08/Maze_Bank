/**
 * POST /api/login
 *
 * Custom server-side login endpoint used for testing the Firestore lookup +
 * password-hash comparison path. It is intentionally independent of the
 * client-side Firebase Auth flow.
 *
 * Body: { "email": string, "password": string }
 *
 * On success it also mints a Firebase session cookie (same as the app's
 * normal login) so the endpoint can be used to establish a real session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { verifyPassword } from "@/lib/password";

const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000;
const SESSION_DURATION_S = 60 * 60 * 24 * 5;

/**
 * The Admin SDK has no "sign in" helper, so exchange credentials for an ID
 * token via the Identity Toolkit REST endpoint, then exchange that for a
 * session cookie.
 */
async function signInWithPassword(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set");

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!res.ok) {
    throw new Error(`signInWithPassword failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  let userDoc;
  try {
    // Look up the user by email via a Firestore query.
    const snap = await getAdminDb()
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snap.empty) {
      // Same generic message for unknown user and wrong password.
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    userDoc = snap.docs[0];
  } catch (err) {
    console.error("[/api/login] Firestore lookup failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const data = userDoc.data();
  const storedHash = data?.passwordHash as string | undefined;

  if (!storedHash || !verifyPassword(password, storedHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Password is correct — sign in via Firebase Auth and issue a session cookie.
  try {
    const idToken = await signInWithPassword(email, password);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const res = NextResponse.json({
      ok: true,
      uid: userDoc.id,
      email: data?.email,
      role: data?.role ?? "user",
    });

    res.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_S,
    });
    return res;
  } catch (err) {
    // The test user exists in Firestore but not in Firebase Auth.
    console.error("[/api/login] session creation failed:", err);
    return NextResponse.json(
      { ok: true, warning: "Credentials valid, but no Firebase Auth account", uid: userDoc.id },
      { status: 200 }
    );
  }
}
