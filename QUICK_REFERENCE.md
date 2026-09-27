# Maze Bank — Quick Reference Guide

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Setup
1. Copy all Firebase values from `.env.local` (already configured)
2. Add Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-v7-xxxxx...
   ```

### Create Admin Account
```bash
npx ts-node --project tsconfig.json scripts/seed-admin.ts
```
- Email: `aspirasj6@gmail.com`
- Password: `@Qweasd123`

### Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

---

## 📋 Feature Overview

| Feature | Route | Role | File |
|---------|-------|------|------|
| Dashboard | `/dashboard` | User | Built-in |
| Transfer | `/transfer` | User | Built-in |
| Transactions | `/transactions` | User | Built-in |
| **Analytics** | **`/analytics`** | **User** | **app/analytics/page.tsx** |
| **Profile** | **`/profile`** | **User** | **app/profile/page.tsx** |
| **Admin** | **`/admin`** | **Admin** | **app/admin/page.tsx** |
| **MazeBot** | *Bubble on all pages* | *User* | *components/MazeBot.tsx* |
| **Notifications** | *Bell in navbar* | *User* | *components/NotificationBell.tsx* |

---

## 🔑 Key Components

### MazeBot (AI Chatbot)
- **Location**: Bottom-right bubble on authenticated pages
- **Files**: `components/MazeBot.tsx`, `actions/chat.ts`
- **API**: Anthropic Claude 3.5 Sonnet
- **Context**: User balance, recent 5 transactions, account number

### Admin Dashboard
- **URL**: `/admin`
- **Access**: Admin role only
- **Features**: User list, search, balance adjustment, freeze accounts
- **Files**: `app/admin/page.tsx`, `components/AdminDashboardClient.tsx`, `actions/admin.ts`

### Analytics
- **URL**: `/analytics`
- **Charts**: Monthly spending, sent vs received, top 5 recipients
- **Files**: `app/analytics/page.tsx`, `components/Analytics.tsx`
- **Library**: Recharts

### Notifications
- **Location**: Bell icon in navbar
- **Auto-trigger**: On received transfer
- **Firestore**: `notifications/{uid}/items/{id}`
- **Files**: `actions/notifications.ts`, `components/NotificationBell.tsx`

### Profile Settings
- **URL**: `/profile`
- **Features**: Update name, change password, view account details
- **Files**: `app/profile/page.tsx`, `components/ProfileClient.tsx`, `actions/profile.ts`

---

## 📁 Project Structure

```
Maze Bank 2/
├── app/
│   ├── admin/page.tsx              (NEW)
│   ├── analytics/page.tsx          (NEW)
│   ├── profile/page.tsx            (NEW)
│   └── [existing pages]
├── actions/
│   ├── chat.ts                     (NEW)
│   ├── admin.ts                    (NEW)
│   ├── notifications.ts            (NEW)
│   ├── profile.ts                  (NEW)
│   ├── transfer.ts                 (MODIFIED)
│   └── auth.ts
├── components/
│   ├── MazeBot.tsx                 (NEW)
│   ├── AdminDashboardClient.tsx    (NEW)
│   ├── Analytics.tsx               (NEW)
│   ├── NotificationBell.tsx        (NEW)
│   ├── ProfileClient.tsx           (NEW)
│   ├── Layout.tsx                  (MODIFIED)
│   └── [other components]
├── lib/
│   ├── firestore.ts                (MODIFIED - added role, isFrozen)
│   └── firebase-admin.ts
├── scripts/
│   └── seed-admin.ts               (NEW)
├── middleware.ts                   (MODIFIED - added routes)
├── package.json                    (MODIFIED - added deps)
├── .env.local.example              (MODIFIED - added ANTHROPIC_API_KEY)
└── IMPLEMENTATION_SUMMARY.md       (NEW)
```

---

## 🔐 Security

- **Admin Panel**: Protected by `role === "admin"` verification on all actions
- **Middleware**: All protected routes require session cookie
- **MazeBot**: System prompt limits to banking questions only
- **Notifications**: Created server-side only on verified transfers
- **Admin Actions**: Recorded as `admin_adjustment` transactions for audit trail

---

## 📊 Firestore Schema Changes

### Users Document
```javascript
{
  uid: string,
  name: string,
  email: string,
  balance: number,
  accountNumber: string,
  role?: "user" | "admin",      // NEW
  isFrozen?: boolean,            // NEW
  createdAt: Timestamp
}
```

### Transactions Document
```javascript
{
  id: string,
  fromUid: string,
  toUid: string,
  fromAccount: string,
  toAccount: string,
  amount: number,
  type: "transfer" | "deposit" | "withdrawal" | "admin_adjustment",  // NEW
  status: "completed" | "pending" | "failed",
  note: string,
  adminReason?: string,          // NEW
  createdAt: Timestamp
}
```

### Notifications Collection (NEW)
```
notifications/{uid}/items/{id}
{
  message: string,
  type: "transfer_received" | "large_debit" | "admin_action",
  read: boolean,
  createdAt: Timestamp
}
```

---

## 🧪 Testing Checklist

- [ ] Register and login
- [ ] Open MazeBot and ask about balance
- [ ] Transfer money to another account
- [ ] Check notifications for received transfer
- [ ] Visit /analytics and view charts
- [ ] Visit /profile, update name, change password
- [ ] Login as admin (`aspirasj6@gmail.com` / `@Qweasd123`)
- [ ] Visit /admin dashboard
- [ ] Search users, adjust balance, freeze account

---

## 🚢 Deployment (Vercel)

1. Push code to GitHub
2. Import in Vercel → Settings → Environment Variables
3. Add `ANTHROPIC_API_KEY=sk-ant-...`
4. Deploy
5. Run seed script in production: `vercel env pull && npx ts-node --project tsconfig.json scripts/seed-admin.ts`

---

## 📝 Dependencies Added

- `@anthropic-ai/sdk`: ^0.24.3 - AI chatbot
- `recharts`: ^2.12.7 - Analytics charts
- `ts-node`: ^10.9.2 - Script runner

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| MazeBot not showing | Check `ANTHROPIC_API_KEY` in `.env.local` |
| Admin dashboard 403 | Ensure logged in as admin user (role field set) |
| Notifications not appearing | Check Firestore collection `notifications/{uid}/items` |
| Charts not rendering | Ensure recharts is installed: `npm install recharts` |
| Password change fails | Clear Firebase cache, re-authenticate |

---

## 📞 Support

All code follows Maze Bank's existing patterns:
- Server actions for all database operations
- Client components for interactive UI
- Firestore for all data persistence
- Firebase Auth for authentication
- Tailwind CSS for styling with brand colors (brand: #0a3d2e, gold: #c9a84c)
