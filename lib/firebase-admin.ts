import 'server-only';

/**
 * Firebase Admin SDK — server-side only.
 * Never import this in client components or client-side code.
 *
 * Uses lazy initialization so the Admin SDK is only instantiated when a
 * server function actually calls it — not at module-import time. This
 * prevents Next.js from throwing during the static build phase when
 * environment variables are not present.
 */
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _app: App | undefined;

function getAdminApp(): App {
  if (_app) return _app;

  // Re-use an already-initialized app (e.g. from a previous hot-reload cycle)
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin environment variables. " +
        "Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return _app;
}

/** Lazily-initialised Firebase Admin Auth instance. */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Lazily-initialised Firestore Admin instance. */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * @deprecated Use getAdminAuth() instead. Kept for gradual migration.
 */
export const adminAuth = {
  get createSessionCookie() {
    return getAdminAuth().createSessionCookie.bind(getAdminAuth());
  },
  get verifySessionCookie() {
    return getAdminAuth().verifySessionCookie.bind(getAdminAuth());
  },
};

/**
 * @deprecated Use getAdminDb() instead. Kept for gradual migration.
 */
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(db) : value;
  },
});
