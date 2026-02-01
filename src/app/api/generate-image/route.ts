import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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

    // gpt-image-1 は b64_json をデフォルトで返す。url がある場合はそれを使う
    if (imageData?.url) {
      return NextResponse.json({ imageUrl: imageData.url });
    }

    if (imageData?.b64_json) {
      // base64 を画像ファイルとして保存して URL を返す
      const generatedDir = join(process.cwd(), "public", "generated");
      if (!existsSync(generatedDir)) {
        await mkdir(generatedDir, { recursive: true });
      }

      const filename = `day-${date}-${Date.now()}.png`;
      const filepath = join(generatedDir, filename);
      const buffer = Buffer.from(imageData.b64_json, "base64");
      await writeFile(filepath, buffer);

      return NextResponse.json({ imageUrl: `/generated/${filename}` });
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
