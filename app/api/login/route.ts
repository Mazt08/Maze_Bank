/**
 * POST /api/login
 *
 * Server-side credential check against the Firestore `users` collection.
 *
 * Firebase Auth is deliberately NOT used here: the password is verified with
 * bcrypt on this server, so nothing is ever sent to
 * identitytoolkit.googleapis.com. This keeps the whole credential check on
 * your own infrastructure and makes the endpoint directly testable with
 * tools like Hydra or ffuf.
 *
 * Body: { "email": string, "password": string }
 *
 * Failure is intentionally indistinguishable between "no such user" and
 * "wrong password" — same status, same body, and a comparable response time —
 * so attackers cannot enumerate valid e-mail addresses.
 */
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminDb } from "@/lib/firebase-admin";

// Read env vars at request time on Vercel's serverless runtime.
export const dynamic = "force-dynamic";

const GENERIC_FAILURE = "Invalid email or password.";

/**
 * Compared against when the e-mail does not exist, so "unknown user" costs
 * roughly the same wall-clock time as "wrong password" and the timing
 * difference cannot be used to enumerate accounts.
 */
const DUMMY_HASH =
  "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";

/** Single, consistent failure response for every credential failure. */
function fail(): NextResponse {
  return NextResponse.json(
    { success: false, message: GENERIC_FAILURE },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    // Malformed JSON — same shape as a credential failure.
    return fail();
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === ""
  ) {
    return fail();
  }

  const normalisedEmail = email.trim().toLowerCase();

  let userDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  try {
    const snapshot = await getAdminDb()
      .collection("users")
      .where("email", "==", normalisedEmail)
      .limit(1)
      .get();

    userDoc = snapshot.docs[0];
  } catch (error) {
    // Firestore misconfiguration or outage. Do not leak the reason to the
    // client, but do log it server-side so it stays debuggable.
    console.error("[/api/login] Firestore lookup failed:", error);
    return NextResponse.json(
      { success: false, message: "Server error." },
      { status: 500 },
    );
  }

  const storedHash =
    typeof userDoc?.data()?.passwordHash === "string"
      ? (userDoc.data().passwordHash as string)
      : DUMMY_HASH;

  // bcrypt always runs, even for unknown users, to flatten the timing profile.
  const passwordMatches = await bcrypt.compare(password, storedHash);

  if (!userDoc || !passwordMatches) {
    return fail();
  }

  return NextResponse.json(
    { success: true, message: "Login successful" },
    { status: 200 },
  );
}
