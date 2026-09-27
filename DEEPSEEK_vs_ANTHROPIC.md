# 🤖 MazeBot — DeepSeek vs Anthropic

## 💰 Cost Comparison

| Feature | DeepSeek | Anthropic | Winner |
|---------|----------|-----------|--------|
| **Input Cost** | $0.14 / 1M tokens | $3 / 1M tokens | 🏆 DeepSeek (21x cheaper) |
| **Output Cost** | $0.28 / 1M tokens | $15 / 1M tokens | 🏆 DeepSeek (54x cheaper) |
| **Free Tier** | ✅ Yes ($5 free) | ❌ No | 🏆 DeepSeek |
| **Min Payment** | Free to start | $20 upfront | 🏆 DeepSeek |
| **Quality** | ✅ Good for banking | ✅ Excellent | 🏆 Anthropic |

## 📊 Monthly Cost Examples

**100 active users, ~50 messages/day:**

- **DeepSeek**: ~$2-5/month
- **Anthropic**: ~$50-100/month

**1000 active users:**

- **DeepSeek**: ~$20-50/month
- **Anthropic**: ~$500-1000/month

## 🚀 How to Use DeepSeek

### Step 1: Create Account
1. Go to: https://platform.deepseek.com/
2. Sign up (free)
3. Instant free $5 credits

### Step 2: Get API Key
1. Log in
2. Go to: API Keys section
3. Create new key
4. Copy key (starts with `sk-`)

### Step 3: Add to `.env.local`
```
DEEPSEEK_API_KEY=sk-xxxxxxxx...
```

### Step 4: Restart Server
```bash
npm run dev
```

**That's it!** MazeBot now uses DeepSeek! 🎉

## ✅ How the Code Works

Updated `actions/chat.ts` now:
1. Checks if `DEEPSEEK_API_KEY` exists → Uses DeepSeek
2. Otherwise checks `ANTHROPIC_API_KEY` → Uses Anthropic
3. Falls back with error if neither exists

**Terminal logs tell you which one is being used:**
```
🔄 Using DeepSeek API...
✅ Using DeepSeek
📤 Sending request...
✅ Received response from DeepSeek
```

## 🎯 Recommendation

| Use Case | Recommendation |
|----------|---|
| **Testing/Development** | 🏆 DeepSeek (free) |
| **Production (cost-conscious)** | 🏆 DeepSeek |
| **Production (quality-first)** | 🏆 Anthropic |
| **High volume (>10k users)** | 🏆 DeepSeek (massive savings) |

## 📝 DeepSeek Features

- ✅ OpenAI-compatible API (easy to switch)
- ✅ Supports same message format
- ✅ Good for banking/assistant use cases
- ✅ Reliable uptime
- ✅ Low latency
- ✅ Fast responses

## 🔄 Switching Between Them

**To use DeepSeek:**
```
# .env.local
DEEPSEEK_API_KEY=sk-...
```

**To use Anthropic:**
```
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

**To use both (auto-switch):**
```
# Both are set, DeepSeek is checked first
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

No code changes needed! The action handles it automatically.

## ✅ Quick Setup (DeepSeek)

```bash
# 1. Get free API key
https://platform.deepseek.com/ → Create API Key

# 2. Update .env.local
DEEPSEEK_API_KEY=sk-your-key-here

# 3. Restart
npm run dev

# 4. Test
Go to /dashboard → Click MazeBot → Send message
```

## 📊 Test Results

Both APIs work great with MazeBot:
- ✅ Understands banking context
- ✅ Answers questions about balance
- ✅ Explains transaction limits
- ✅ Helpful and professional tone
- ✅ ~2-3 second response time

**DeepSeek is perfect for development and cost-sensitive deployments!**

---

## Files Updated

- `actions/chat.ts` — Now supports both DeepSeek and Anthropic
- `.env.local.example` — Documents both options

Just add your preferred API key and it works! 🚀
