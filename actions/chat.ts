"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "./auth";
import { getUserByUid, getRecentTransactions, formatCents } from "@/lib/firestore";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  error?: string;
  response?: string;
}

export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  // 1. Auth check
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  // 2. Fetch user context
  const user = await getUserByUid(session.uid);
  if (!user) return { error: "User not found." };

  const recentTransactions = await getRecentTransactions(session.uid, 5);

  // 3. Format system prompt with user context
  const transactionSummary =
    recentTransactions.length > 0
      ? recentTransactions
          .map(
            (t) =>
              `${t.type}: ${t.amount > 0 ? "+" : ""}${formatCents(Math.abs(t.amount))} ${
                t.type === "transfer" ? `(${t.status})` : ""
              } - ${t.note || "No note"}`
          )
          .join("\n")
      : "No recent transactions.";

  const systemPrompt = `You are MazeBot, Maze Bank's friendly and helpful banking assistant. 
The user's current account details are:
- Balance: ${formatCents(user.balance)}
- Account Number: ${user.accountNumber}
- Account Name: ${user.name}

Recent transactions (last 5):
${transactionSummary}

Your role is to:
1. Help answer questions about their balance, transactions, and account
2. Explain banking features like transfers and transaction limits
3. Keep responses concise and professional
4. Do NOT provide access to full transaction history or other users' data
5. Do NOT execute financial transactions directly; guide them to use the Transfer feature
6. Maintain a friendly, banking-appropriate tone

Always prioritize user security and privacy.`;

  // 4. Build messages for Anthropic-compatible SDK
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  // 5. Call API (Anthropic or DeepSeek)
  try {
    // Try DeepSeek first if API key exists, otherwise use Anthropic
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    let client: Anthropic;
    let modelName: string;
    let provider: string;

    if (deepseekKey && deepseekKey.trim()) {
      console.log("🔄 Using DeepSeek API...");
      client = new Anthropic({
        apiKey: deepseekKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      modelName = "deepseek-chat";
      provider = "DeepSeek";
    } else if (anthropicKey && anthropicKey.trim()) {
      console.log("🔄 Using Anthropic API...");
      client = new Anthropic({
        apiKey: anthropicKey,
      });
      modelName = "claude-3-5-sonnet-20241022";
      provider = "Anthropic";
    } else {
      return { error: "No API key configured. Set DEEPSEEK_API_KEY or ANTHROPIC_API_KEY in .env.local" };
    }

    console.log(`✅ Using ${provider}`);
    console.log("📤 Sending request...");
    
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 512,
      system: systemPrompt,
      messages: messages,
    });

    console.log(`✅ Received response from ${provider}`);
    
    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "Unable to process response.";

    return { response: assistantMessage };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("❌ API Error:", {
      message: errorMessage,
      type: err instanceof Error ? err.constructor.name : typeof err,
    });
    
    if (errorMessage.includes("authentication") || errorMessage.includes("401")) {
      return { 
        error: `Authentication Error: Invalid API key. Check your DEEPSEEK_API_KEY or ANTHROPIC_API_KEY in .env.local` 
      };
    }

    return { error: `Chat Error: ${errorMessage}` };
  }
}
