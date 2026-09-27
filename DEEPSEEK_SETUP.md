# 🚀 DeepSeek Setup — Get MazeBot Working for FREE

## ⚡ 3-Minute Setup

### Step 1: Get Free API Key
1. Go to: **https://platform.deepseek.com/**
2. Click **"Sign Up"**
3. Create account (email + password)
4. You get **$5 free credits** instantly ✅

### Step 2: Create API Key
1. Log in to deepseek.com
2. Click **"API Keys"** (left sidebar)
3. Click **"Create New Key"**
4. Name: `maze-bank` (optional)
5. Copy the full key (starts with `sk-`)

### Step 3: Update `.env.local`
Add this line to your `.env.local` file:
```
DEEPSEEK_API_KEY=sk-xxxxxxxx...
```

**Example:**
```
# Existing Firebase config...
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
FIREBASE_PROJECT_ID=maze-bank-4e8da
...

# Add this line:
DEEPSEEK_API_KEY=sk-1234567890abcdefghij...
```

### Step 4: Restart Dev Server
```bash
# Kill current server (Ctrl+C if running)
npm run dev
```

### Step 5: Test MazeBot
1. Go to: http://localhost:3000
2. Login to dashboard
3. Click 💬 MazeBot bubble
4. Send any message
5. Should get response! 🎉

---

## ✅ Verification

**Check terminal logs:**
```
🔄 Using DeepSeek API...
✅ Using DeepSeek
📤 Sending request...
✅ Received response from DeepSeek
```

**Or:**
```
🔄 Using Anthropic API...
✅ Using Anthropic
📤 Sending request...
✅ Received response from Anthropic
```

## 💰 Cost

- **First 5 hours of testing**: FREE ($5 credit)
- **After that**: ~$0.001 per message (~$0.03 for 30 messages)
- **1000 messages**: ~$0.03
- **10,000 messages**: ~$0.30
- **Very affordable!**

## 🎯 How It Works

```
Your browser sends message
    ↓
MazeBot client component
    ↓
Calls chat() server action
    ↓
action/chat.ts checks for DEEPSEEK_API_KEY
    ↓
Sends to DeepSeek API
    ↓
Gets response
    ↓
Returns to browser
    ↓
Display in chat bubble ✅
```

## 🔄 Both Providers?

You can have both API keys in `.env.local`:

```
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

The code tries DeepSeek first, falls back to Anthropic if not available.

## ⚠️ If It Doesn't Work

### Check 1: API Key in `.env.local`?
```bash
cat .env.local | grep DEEPSEEK
# Should show: DEEPSEEK_API_KEY=sk-...
```

### Check 2: Restarted dev server?
```bash
# Kill (Ctrl+C)
npm run dev
```

### Check 3: Check terminal logs
Should show: `✅ Using DeepSeek`

### Check 4: Get new key
If still failing, create brand new key at platform.deepseek.com

## 📝 `.env.local` Template

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=maze-bank-4e8da.firebaseapp.com
FIREBASE_PROJECT_ID=maze-bank-4e8da
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# DeepSeek (CHEAPER - recommended)
DEEPSEEK_API_KEY=sk-your-key-here

# OR Anthropic (if you prefer)
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## ✅ Ready?

1. ✅ Create DeepSeek account
2. ✅ Get API key
3. ✅ Add to `.env.local`
4. ✅ Restart server
5. ✅ Test MazeBot

**You're all set!** 🚀

For more details, see `DEEPSEEK_vs_ANTHROPIC.md`
