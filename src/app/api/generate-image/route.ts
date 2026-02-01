import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { date, schedule, events } = await request.json();

    // プロンプトを生成
    let prompt = "";

    if (schedule && schedule.length > 0) {
      // 予定がある場合、予定に基づいた画像を生成
      const scheduleDescriptions = schedule.map((s: { title: string }) => s.title).join(", ");
      prompt = `A beautiful, peaceful illustration representing a day with these activities: ${scheduleDescriptions}. Style: soft watercolor, warm colors, minimalist, Japanese aesthetic, no text.`;
    } else if (events && events.length > 0) {
      // イベントがある場合
      const eventDescriptions = events.map((e: { title: string }) => e.title).join(", ");
      prompt = `A beautiful illustration celebrating: ${eventDescriptions}. Style: soft watercolor, warm colors, minimalist, Japanese aesthetic, no text.`;
    } else {
      // 予定がない場合、日付にちなんだ画像
      const dateObj = new Date(date);
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();

      // 季節や日付に基づいたプロンプト
      let seasonTheme = "";
      if (month >= 1 && month <= 2) {
        seasonTheme = "winter scenery with snow, cozy indoor scene";
      } else if (month >= 3 && month <= 5) {
        seasonTheme = "spring cherry blossoms, fresh green leaves";
      } else if (month >= 6 && month <= 8) {
        seasonTheme = "summer beach, sunflowers, blue sky";
      } else {
        seasonTheme = "autumn leaves, harvest, warm sunset";
      }

      prompt = `A beautiful peaceful illustration of ${seasonTheme}. Date: ${month}/${day}. Style: soft watercolor, warm colors, minimalist, Japanese aesthetic, no text.`;
    }

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "low",
    });

    const imageData = response.data?.[0];

    // URL がある場合はそのまま返す
    if (imageData?.url) {
      return NextResponse.json({ imageUrl: imageData.url });
    }

    // b64_json の場合は Data URL として返す（Vercel等でファイル書き込みできない環境対応）
    if (imageData?.b64_json) {
      return NextResponse.json({ imageUrl: `data:image/png;base64,${imageData.b64_json}` });
    }

    throw new Error("No image data in API response");
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
