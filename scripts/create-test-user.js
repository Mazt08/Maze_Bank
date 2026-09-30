/**
 * Creates / updates a test user in the Firestore `users` collection with a
 * bcrypt-hashed password.
 *
 * Usage:
 *   node scripts/create-test-user.js
 *   node scripts/create-test-user.js someone@example.com "hunter2" "Some One" user
 *
 * Requires the FIREBASE_* admin env vars (same ones the app uses) to be
 * present in the environment or in .env.local.
 *
 * NOTE: passwords here are hashed with bcrypt (bcryptjs) — the same scheme
 * that POST /api/login verifies against. Do not use this script for users
 * that sign in through Firebase Auth; those have their own password store.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";

config({ path: ".env.local" });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.\n" +
      "Set them in .env.local or as environment variables before running this script.",
  );
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

const email = (process.argv[2] ?? "test@gmail.com").trim().toLowerCase();
const password = process.argv[3] ?? "test123";
const name = process.argv[4] ?? "Test User";
const role = process.argv[5] ?? "user";

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await db.collection("users").where("email", "==", email).limit(1).get();

  const data = { email, name, role, passwordHash };

  if (!existing.empty) {
    const doc = existing.docs[0];
    await doc.ref.set(data, { merge: true });
    console.log(`Updated existing user ${email} (doc id: ${doc.id})`);
  } else {
    const ref = await db.collection("users").add(data);
    console.log(`Created user ${email} (doc id: ${ref.id})`);
  }

  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  hash:     ${passwordHash}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error("Failed:", err);
    process.exit(1);
  },
);