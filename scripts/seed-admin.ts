#!/usr/bin/env ts-node

/**
 * Admin Seed Script for Maze Bank
 * Run once: npx ts-node --project tsconfig.json scripts/seed-admin.ts
 *
 * Creates a Firebase Auth user and Firestore admin document if they don't already exist.
 * Admin credentials:
 * - Email: aspirasj6@gmail.com
 * - Password: @Qweasd123
 * - Name: John Rex Aspiras
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { config } from "dotenv";

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

const ADMIN_EMAIL = "aspirasj6@gmail.com";
const ADMIN_PASSWORD = "@Qweasd123";
const ADMIN_NAME = "John Rex Aspiras";
const ADMIN_ACCOUNT_NUMBER = "MZB-000000";

async function seedAdmin() {
  try {
    console.log("🔐 Starting admin seed script...");

    // Check if admin user already exists
    let existingUser;
    try {
      existingUser = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      console.log(`✓ Admin user already exists with UID: ${existingUser.uid}`);
    } catch (err) {
      if ((err as any).code !== "auth/user-not-found") {
        throw err;
      }
      // User doesn't exist, create them
      console.log(`📝 Creating admin user: ${ADMIN_EMAIL}`);
      existingUser = await adminAuth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
      });
      console.log(`✓ Admin user created with UID: ${existingUser.uid}`);
    }

    // Create or update Firestore admin document
    const userRef = adminDb.collection("users").doc(existingUser.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      console.log(`📄 Creating Firestore admin document...`);
      await userRef.set({
        uid: existingUser.uid,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        balance: 100_000_000, // $1,000,000.00 in cents
        accountNumber: ADMIN_ACCOUNT_NUMBER,
        role: "admin",
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log(`✓ Firestore admin document created`);
    } else {
      // Document exists, ensure role is set to admin
      const currentData = userSnap.data();
      if (currentData?.role !== "admin") {
        console.log(`🔄 Updating user role to admin...`);
        await userRef.update({ role: "admin" });
        console.log(`✓ User role updated to admin`);
      } else {
        console.log(`✓ Firestore document already has admin role`);
      }
    }

    console.log("\n✅ Admin seed completed successfully!");
    console.log(`\n📋 Admin Credentials:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Name: ${ADMIN_NAME}`);
    console.log(`   UID: ${existingUser.uid}`);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
