# Maze Bank 🏦

A full-stack web banking demo built with **Next.js 14 App Router**, **Firebase Auth + Firestore**, and **Tailwind CSS**. Deployable for free on Vercel.

---

## Features

| Feature | Details |
|---|---|
| Authentication | Firebase Auth (email/password) with HttpOnly session cookies |
| Balance & Transactions | Firestore real-time data, server-side only |
| Transfers | Atomic Firestore transactions, $10k limit, self-transfer protection |
| Route protection | Next.js Edge Middleware checks session cookie |
| Zero client-side DB access | All Firestore reads/writes go through Server Components or Server Actions |

---

## Project structure

```
app/
  layout.tsx          # Root HTML shell
  page.tsx            # Landing page
  login/page.tsx
  register/page.tsx
  dashboard/page.tsx
  transfer/page.tsx
  transactions/page.tsx
components/
  Layout.tsx          # Shared authenticated layout (nav, footer)
  AuthForm.tsx        # Client component — Firebase client auth
  TransferForm.tsx    # Client component — useFormState transfer form
actions/
  auth.ts             # setSession, clearSession, getSession, registerUser
  transfer.ts         # transferFunds (atomic Firestore transaction)
lib/
  firebase-admin.ts   # Admin SDK singleton (server only)
  firebase-client.ts  # Client SDK (browser auth only)
  firestore.ts        # Types + data helpers
middleware.ts         # Edge route protection
```

---

## Local development

### 1. Prerequisites

- Node.js 18+
- A Firebase project with **Authentication** (Email/Password) and **Firestore** enabled

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

**Client variables** — from Firebase Console → Project settings → Your apps → Web SDK config:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Admin SDK variables** — from Firebase Console → Project settings → Service accounts → Generate new private key:

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY      # Wrap in double quotes; keep literal \n sequences
```

> ⚠️ **Private key formatting**: Paste the key with literal `\n` (not real newlines), wrapped in double quotes:
> ```
> FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
> ```

### 4. Firestore indexes

The transactions query uses two compound queries (by `fromUid` and `toUid` with `timestamp` ordering). Firestore will prompt you to create the required indexes the first time you run the queries — follow the link in the error message.

Alternatively, create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fromUid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toUid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy with: `firebase deploy --only firestore:indexes`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment on Vercel (free tier)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial Maze Bank"
git remote add origin https://github.com/YOUR_USER/maze-bank.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)

### 3. Add environment variables

In Vercel → Project → Settings → Environment Variables, add **all** variables from `.env.local.example`.

> **Critical for `FIREBASE_PRIVATE_KEY`**: Paste the raw value including `-----BEGIN PRIVATE KEY-----`, with literal `\n` characters. Vercel stores it verbatim; the app replaces `\n` → real newlines at runtime.

### 4. Deploy

Click **Deploy**. Vercel will build and serve the app.

---

## Firestore security rules

Apply these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // All reads/writes go through the Admin SDK (bypasses rules),
    // so deny all direct client access.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Architecture notes

- **Balance is stored in cents (integer)** to avoid floating-point rounding errors. `$10.00 = 1000`.
- **Transfers are atomic** — both the debit and credit happen in a single `runTransaction` call. If either fails, neither is applied.
- **Session cookies** use Firebase Admin's `createSessionCookie`, which produces a short-lived, revocable, HttpOnly cookie. The Edge Middleware checks for its presence; full cryptographic verification happens in each server component.
- **No API routes** are used — everything goes through Server Actions, keeping the codebase lean and within Vercel's free-tier function limits.
- **`force-dynamic`** on authenticated pages prevents caching stale balance data.

---

## Tech stack

| | Version |
|---|---|
| Next.js | 14.2.15 |
| React | 18.3.1 |
| Firebase (client) | 10.13.2 |
| Firebase Admin | 12.5.0 |
| Tailwind CSS | 3.4.13 |
| TypeScript | 5.6.2 |
