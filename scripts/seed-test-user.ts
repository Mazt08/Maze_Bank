#!/usr/bin/env ts-node

/**
 * Test User Seed Script for Maze Bank.
 * Run once: npx ts-node --project tsconfig.json scripts/seed-test-user.ts
 *
 * Creates a THROWAWAY user used only by the /api/login test endpoint.
 * Credentials:
 * - Email: test@gmail.com
 * - Password: test123
 *
 * Creates/updates both the Firebase Auth user and the Firestore document
 * (which stores a scrypt password hash under `passwordHash`).
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { config } from "dotenv";
import { randomBytes, scryptSync } from "node:crypto";

config({ path: ".env.local" });

const adminApp =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

const TEST_EMAIL = "test@gmail.com";
const TEST_PASSWORD = "test123";
const TEST_NAME = "Test User";
const TEST_ACCOUNT_NUMBER = "MZB-999999";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function seedTestUser() {
  try {
    console.log("🧪 Seeding throwaway test user...");

    let user;
    try {
      user = await adminAuth.getUserByEmail(TEST_EMAIL);
      console.log(`✓ Firebase Auth user exists (UID: ${user.uid})`);
    } catch (err) {
      if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
      user = await adminAuth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_NAME,
      });
      console.log(`✓ Firebase Auth user created (UID: ${user.uid})`);
    }

    await adminDb
      .collection("users")
      .doc(user.uid)
      .set(
        {
          uid: user.uid,
          name: TEST_NAME,
          email: TEST_EMAIL,
          balance: 100_000,
          accountNumber: TEST_ACCOUNT_NUMBER,
          role: "user",
          isTestUser: true,
          passwordHash: hashPassword(TEST_PASSWORD),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    console.log("✓ Firestore test user document written (passwordHash stored)");
    console.log("\n✅ Test user ready.");
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   UID: ${user.uid}`);
    console.log("\n   Test with:");
    console.log(
      `   curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"email":"${TEST_EMAIL}","password":"${TEST_PASSWORD}"}'`
    );
  } catch (error) {
    console.error("❌ Error seeding test user:", error);
    process.exit(1);
  }
}

seedTestUser();
