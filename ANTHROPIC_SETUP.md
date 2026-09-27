# 🔧 ANTHROPIC_API_KEY — Setup & Troubleshooting

## ✅ Setup Complete

The API key has been added to `.env.local` and the chat server action has been improved with better error logging.

---

## 📋 What Was Fixed

### 1. ✅ Removed BOM (Byte Order Mark)
- `.env.local` had UTF-8 BOM that could interfere with parsing
- Removed to ensure clean environment variable loading

### 2. ✅ Enhanced Error Logging
- `actions/chat.ts` now logs detailed debugging info:
  - Shows if API key is missing
  - Logs first 20 chars of API key for verification
  - Specific handling for 401 authentication errors
  - Console logs for debugging

### 3. ✅ API Key Verification
- Added `.trim()` to remove any whitespace
- Checks for empty strings
- Better error messages

---

## 🚀 How to Verify It's Working

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Check Console Logs
When MazeBot sends a message, you should see in your terminal:
```
✅ Creating Anthropic client with API key (first 20 chars): sk-ant-api03-U8rqX6ZMr
📤 Sending message to Anthropic API...
✅ Received response from Anthropic
```

### Step 3: Test MazeBot
1. Navigate to `/dashboard` or any authenticated page
2. Click the 💬 bubble (bottom-right)
3. Type a message like: "What's my balance?"
4. Should get a response from Claude ✅

---

## 🐛 If You Still Get 401 Error

### Check 1: Verify API Key Format
Your API key should start with: `sk-ant-`

If it doesn't, go to https://console.anthropic.com/api_keys and create a new one.

### Check 2: Verify `.env.local` File
```bash
# Check file exists and has API key
cat .env.local | grep ANTHROPIC_API_KEY
# Should output: ANTHROPIC_API_KEY=sk-ant-...
```

### Check 3: Dev Server Restart
Sometimes Next.js doesn't pick up env changes immediately:
```bash
# Stop server (Ctrl+C)
# Delete .next cache
rm -rf .next

# Restart
npm run dev
```

### Check 4: Check for Typos
Make sure in `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```
- Exact spelling: `ANTHROPIC_API_KEY` (all caps, underscores)
- No spaces around `=`
- Full key starting with `sk-ant-`

### Check 5: Browser Console
Open browser DevTools (F12) → Network tab
1. Click MazeBot and send a message
2. Look for requests to the server action
3. Check the response body for detailed error message

---

## 📝 API Key Location

**In your project:**
```
Maze Bank 2/
└── .env.local
    └── ANTHROPIC_API_KEY=sk-ant-...
```

**Online:**
```
https://console.anthropic.com/api_keys
```

---

## 🔒 Security Notes

- ✅ API key is in `.env.local` (not in git, thanks to `.gitignore`)
- ✅ Server-side only (never exposed to browser)
- ✅ Server action validates before use
- ✅ Console logging includes only first 20 chars for safety

---

## 📊 Enhanced Error Messages

If something goes wrong, you'll now see specific errors:

| Error | Cause | Fix |
|-------|-------|-----|
| "API key not configured" | Missing from `.env.local` | Add `ANTHROPIC_API_KEY=...` |
| "Authentication failed 401" | Invalid key | Check key format at console.anthropic.com |
| "Missing Authentication header" | Key has extra whitespace | Verify no spaces in `.env.local` |
| "Model not found" | API key valid but account limited | Check Anthropic account status |

---

## ✅ Current Status

- **API Key**: ✅ Added to `.env.local`
- **Error Logging**: ✅ Enhanced in `actions/chat.ts`
- **File Encoding**: ✅ Fixed (BOM removed)
- **Error Handling**: ✅ Improved with specific messages

---

## 🎯 Next Steps

1. **Restart your dev server** if it's running
2. **Test MazeBot** by sending a message
3. **Check browser console** for any errors
4. **Check terminal logs** for the new debug output

If it still doesn't work, the terminal logs will now give you specific info about what's wrong!

---

## 📞 Quick Reference

**To get a new API key:**
1. Go to https://console.anthropic.com/api_keys
2. Click "Create Key"
3. Name it (e.g., "Maze Bank")
4. Copy the key
5. Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

**To verify it's loaded:**
- Look for terminal log: `✅ Creating Anthropic client...`
- If you see: `❌ ANTHROPIC_API_KEY is missing` → add it to `.env.local`

**To debug further:**
- Open browser DevTools (F12)
- Go to Console tab
- Send a MazeBot message
- Look for errors in console

All fixes applied and ready to test! ✅
