/**
 * Firebase client SDK — browser only.
 * Only used to authenticate the user and obtain an ID token.
 * All data fetching happens server-side via the Admin SDK.
 *
 * Uses lazy initialization so the SDK is not instantiated at module-import
 * time. This prevents Next.js from throwing during static prerendering when
 * NEXT_PUBLIC_ environment variables are not available in the build environment.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

function getClientApp(): FirebaseApp {
  if (_app) return _app;

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  _app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  return _app;
}

/**
 * Lazily-initialised Firebase Auth instance.
 * Calling this before the browser is ready is fine — Firebase Auth defers
 * its own network calls until needed.
 */
export function getClientAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getClientApp());
  return _auth;
}

/**
 * Convenience re-export for existing call-sites.
 * @deprecated Prefer calling getClientAuth() directly.
 */
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getClientAuth();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
