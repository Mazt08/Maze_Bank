# Node.js Built-ins Error — Fixes Applied

## Problem
Firebase Admin SDK uses Node.js built-ins (`net`, `tls`, `dns`, `fs`, `child_process`) that cannot run in browsers or Edge runtime. Client components importing server-only modules directly cause:
```
Module not found: Can't resolve 'net'
```

## Root Cause
Client components were importing from `lib/firestore.ts` which depends on `firebase-admin`, which requires Node.js modules.

## Solution Applied

### 1. ✅ Updated `next.config.js`
Added webpack configuration to exclude Node.js built-ins from client bundle:

```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      dns: false,
      fs: false,
      child_process: false,
    };
  }
  return config;
},
```

**Effect**: Client-side bundler won't attempt to include Node.js modules, preventing build errors.

---

### 2. ✅ Added `import 'server-only'` to server-only modules

**File: `lib/firebase-admin.ts`**
```typescript
import 'server-only';
```

**File: `lib/firestore.ts`**
```typescript
import 'server-only';
```

**Effect**: If any client component accidentally imports these files, Next.js will throw a clear build error:
```
Error: Module "lib/firebase-admin" cannot be imported from the client side.
```

---

### 3. ✅ Created `lib/utils.ts` for client-safe utilities

**New file: `lib/utils.ts`**
```typescript
/**
 * Client-safe utility functions
 * These can be imported by client components without triggering server-only modules
 */

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
```

**Effect**: Pure utility functions with no Firestore/firebase-admin dependencies can be safely imported by client components.

---

### 4. ✅ Fixed client component imports

#### Before
```typescript
// ❌ WRONG: Client component importing from lib/firestore
import { formatCents } from "@/lib/firestore";
```

#### After
```typescript
// ✅ CORRECT: Client component importing from lib/utils
import { formatCents } from "@/lib/utils";
```

**Files fixed:**
- `components/AdminDashboardClient.tsx`
- `components/Analytics.tsx`
- `components/ProfileClient.tsx`

---

### 5. ✅ Refactored server component imports (best practice)

For cleaner separation of concerns, server components now import `formatCents` from `lib/utils` instead of `lib/firestore`:

**Files updated:**
- `app/dashboard/page.tsx`
- `app/transactions/page.tsx`
- `app/transfer/page.tsx`

**Note**: This is optional but recommended for clarity. These are server components, so they *could* import from `lib/firestore`, but importing from `lib/utils` signals that they're using pure utility functions.

---

## Architecture Rules (Going Forward)

### ✅ Allowed

**Server Components** (no "use client" directive):
```typescript
import { getUserByUid } from "@/lib/firestore";     // ✅ OK
import { adminDb } from "@/lib/firebase-admin";     // ✅ OK
import { formatCents } from "@/lib/utils";          // ✅ OK
```

**Server Actions** (files with "use server"):
```typescript
"use server";
import { getUserByUid } from "@/lib/firestore";     // ✅ OK
import { adminDb } from "@/lib/firebase-admin";     // ✅ OK
```

**Client Components** (with "use client" directive):
```typescript
import { formatCents } from "@/lib/utils";          // ✅ OK (pure function)
import { someAction } from "@/actions/profile";     // ✅ OK (server action)
```

### ❌ Forbidden

**Client Components must NOT import:**
```typescript
"use client";
import { getUserByUid } from "@/lib/firestore";     // ❌ FORBIDDEN
import { adminDb } from "@/lib/firebase-admin";     // ❌ FORBIDDEN
```

Instead, use server actions:
```typescript
"use client";
import { getUserProfileAction } from "@/actions/profile";  // ✅ CORRECT
const result = await getUserProfileAction();
```

---

## Files Modified

| File | Change |
|------|--------|
| `next.config.js` | Added webpack fallback configuration |
| `lib/firebase-admin.ts` | Added `import 'server-only'` |
| `lib/firestore.ts` | Added `import 'server-only'` |
| `lib/utils.ts` | **CREATED** — Pure utility functions |
| `components/AdminDashboardClient.tsx` | Changed import source to `lib/utils` |
| `components/Analytics.tsx` | Changed import source to `lib/utils` |
| `components/ProfileClient.tsx` | Changed import source to `lib/utils` |
| `app/dashboard/page.tsx` | Changed import source to `lib/utils` (best practice) |
| `app/transactions/page.tsx` | Changed import source to `lib/utils` (best practice) |
| `app/transfer/page.tsx` | Changed import source to `lib/utils` (best practice) |
| `lib/ARCHITECTURE_AUDIT.ts` | **CREATED** — Verification document |

---

## Verification Checklist

- [x] `next.config.js` has webpack fallback for Node.js built-ins
- [x] `lib/firebase-admin.ts` has `import 'server-only'`
- [x] `lib/firestore.ts` has `import 'server-only'`
- [x] `lib/utils.ts` exists and has no server-only dependencies
- [x] All 3 client components import from `lib/utils` for `formatCents`
- [x] All 3 client components do NOT import from `lib/firestore` or `lib/firebase-admin`
- [x] All server actions have `"use server"` directive
- [x] All server components can safely import from `lib/firestore` and `lib/firebase-admin`
- [x] No client component directly imports `getUserByUid`, `adminDb`, or other server-only functions
- [x] All data fetching from client components goes through `actions/*.ts` server actions

---

## Testing

### Build Test
```bash
npm run build
```

Should complete without `Module not found: Can't resolve 'net'` errors.

### Runtime Test
1. Start dev server: `npm run dev`
2. Navigate to authenticated pages: `/dashboard`, `/transfer`, `/transactions`, `/analytics`, `/profile`, `/admin`
3. All pages should load and render correctly
4. MazeBot, notifications, and admin features should work normally

---

## Why This Matters

1. **Security**: Server-only modules marked with `import 'server-only'` cannot accidentally be exposed to clients
2. **Performance**: Client bundle is smaller without unnecessary Node.js modules
3. **Clarity**: Code intent is explicit — developers see which modules are server-only
4. **Maintainability**: Clear separation of concerns makes future refactoring safer

---

## References

- [Next.js Server-Only Packages](https://nextjs.org/docs/getting-started/react-essentials#keeping-server-only-code-out-of-the-client-environment)
- [Firebase Admin SDK + Next.js](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Webpack Fallback Configuration](https://webpack.js.org/configuration/resolve/#resolvefallback)
