# 🔧 Anthropic API Key — 401 Authentication Error

## ⚠️ The Issue

You're getting a **401 Authentication Error** which means:

- API key is missing, invalid, or expired
- The Anthropic server rejected your request

## ✅ How to Fix

### Step 1: Get a New API Key

1. Go to: https://console.anthropic.com/api_keys
2. Sign in with your Anthropic account
3. Click **"Create Key"** (or use existing if valid)
4. Copy the full key (starts with `sk-ant-`)

### Step 2: Update `.env.local`

Replace the old key with your new one:

```bash
# Open file:
.env.local

# Find this line:
ANTHROPIC_API_KEY=sk-ant-YOUR_OLD_KEY_HERE

# Replace with your NEW key:
ANTHROPIC_API_KEY=sk-ant-YOUR_NEW_KEY_HERE
```

### Step 3: Restart Dev Server

```bash
# Kill current process (Ctrl+C)
npm run dev
```

### Step 4: Test Again

1. Go to `/dashboard`
2. Click 💬 MazeBot
3. Send a message
4. Check terminal for: `✅ Received response from Anthropic`

---

## 🔍 Debug Information

When you send a message now, the terminal will show:

```
🔍 DEBUG: Checking ANTHROPIC_API_KEY...
   - Key exists: true
   - Key length: 156
   - Key starts with: sk-ant-api0
📤 Sending request to Anthropic API...
   - Model: claude-3-5-sonnet-20241022
   - Messages: 1
✅ Received response from Anthropic
```

If you see `Key exists: false` → Key is missing from `.env.local`
If you see `Key exists: true` but still 401 → Key is invalid/expired

---

## ⚡ Quick Checklist

- [ ] Go to https://console.anthropic.com/api_keys
- [ ] Create new API key (or copy existing valid one)
- [ ] Paste into `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] No spaces around `=`
- [ ] Full key (including the long random part at end)
- [ ] Restart: `npm run dev`
- [ ] Test: Send MazeBot message

---

## 🚨 Common Issues

| Problem                         | Solution                                     |
| ------------------------------- | -------------------------------------------- |
| "Missing Authentication header" | Get new key from console.anthropic.com       |
| "401 Unauthorized"              | Key is invalid/revoked/expired               |
| "Key exists: false"             | Missing from `.env.local`                    |
| Still getting error             | Try creating brand new key (don't reuse old) |

---

## 📝 Example `.env.local`

**Correct format:**

```
ANTHROPIC_API_KEY=sk-ant-abc123def456ghi789jkl...
```

**Incorrect formats:**

```
ANTHROPIC_API_KEY = sk-ant-...     ❌ Spaces around =
ANTHROPIC_API_KEY='sk-ant-...'     ❌ Quotes around key
ANTHROPIC_API_KEY=sk-ant-...  abc   ❌ Extra text
```

---

## ✅ After You Update

The new error output will be much more helpful. You'll see:

**If key is valid:**

```
✅ Received response from Anthropic
```

**If key is still invalid:**

```
Authentication Error: Your ANTHROPIC_API_KEY may be invalid or expired
```

---

## 📞 Need Help?

1. **Check API key**: https://console.anthropic.com/api_keys
2. **Verify `.env.local`**: Has correct key format
3. **Restart server**: `npm run dev`
4. **Check terminal logs**: Should show detailed debug info
5. **Try new key**: Create brand new one if still failing

**The 401 error almost always means: Invalid, expired, or missing API key**

Get a fresh one from console.anthropic.com and try again! ✅
