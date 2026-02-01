import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT_BASE = `あなたは親切なAIアシスタントです。1〜2文で会話してください。

もしユーザーがカレンダーの予定追加・変更・スケジュール登録に関する指示をした場合、
通常の返答の末尾に以下の形式でカレンダーイベント情報を付与してください。

[CALENDAR_EVENT]{"title":"イベント名","date":"YYYY-MM-DD","time":"HH:MM","color":"green"}[/CALENDAR_EVENT]

- titleはイベントの簡潔な名前
- dateはイベントの日付（YYYY-MM-DD形式）。「明日」「来週月曜」等の相対表現は今日の日付を基準に計算してください
- timeは開始時刻（HH:MM形式）。指定がなければ適切な時刻を推定してください
- colorはイベントの種類に応じて green / blue / purple / orange から選択

カレンダーに関係ない通常の会話では[CALENDAR_EVENT]タグを付けないでください。`;

const buildSystemPrompt = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = dayNames[today.getDay()];
  return `${SYSTEM_PROMPT_BASE}\n\n今日の日付: ${yyyy}-${mm}-${dd}（${dayName}曜日）`;
};

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !model) {
      return NextResponse.json(
        { error: "Messages and model are required" },
        { status: 400 }
      );
    }

    let response: string;

    if (model.startsWith("gpt")) {
      response = await callOpenAI(messages, model);
    } else if (model.startsWith("claude")) {
      response = await callAnthropic(messages, model);
    } else if (model.startsWith("gemini")) {
      response = await callGoogle(messages, model);
    } else {
      return NextResponse.json(
        { error: "Unsupported model" },
        { status: 400 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function callOpenAI(messages: Message[], model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured");
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ],
  });

  return completion.choices[0]?.message?.content || "";
}

async function callAnthropic(messages: Message[], model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}

async function callGoogle(messages: Message[], model: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt(),
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const chat = gemini.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);

  return result.response.text();
}
