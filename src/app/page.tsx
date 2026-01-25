"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const LLM_MODELS = [
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI" },
  { id: "claude-opus-4.5", name: "Opus 4.5", provider: "Anthropic" },
  { id: "gemini-3-flash", name: "Gemini 3 Flash", provider: "Google" },
];

const LIVE_CONTEXT = [
  {
    id: "1",
    app: "Slack",
    icon: "💬",
    summary: "田中さんからミーティング時間変更の相談",
    content: "明日のミーティングを15時に変更したいとのこと",
    suggestedAction: "承知しました！15時に変更しておきますね。カレンダーも更新しておきます。",
    declineMessage: "申し訳ありません、15時は別の予定が入っているため変更が難しい状況です。他の時間帯でご検討いただけますでしょうか。",
    time: "2分前",
  },
  {
    id: "2",
    app: "Gmail",
    icon: "✉️",
    summary: "佐藤様から見積もり依頼",
    content: "新規プロジェクトの見積もりを依頼されています",
    suggestedAction: "佐藤様、お問い合わせありがとうございます。見積もりの件、承りました。詳細を確認の上、本日中にお送りいたします。",
    declineMessage: "佐藤様、お問い合わせありがとうございます。誠に申し訳ございませんが、現在対応が難しい状況です。改めてご連絡させていただきます。",
    time: "5分前",
  },
  {
    id: "3",
    app: "GitHub",
    icon: "🐙",
    summary: "PR #142 のレビュー依頼",
    content: "山本さんからコードレビューを依頼されています",
    suggestedAction: "レビューリクエストを確認しました。本日中にレビューを完了させます。",
    declineMessage: "申し訳ありません、現在他のタスクで手一杯のため、レビューに時間がかかりそうです。他のメンバーにお願いできますでしょうか。",
    time: "10分前",
  },
  {
    id: "4",
    app: "LINE",
    icon: "📱",
    summary: "鈴木さんから飲み会のお誘い",
    content: "今週金曜日に飲み会どうですか？とのこと",
    suggestedAction: "いいですね！金曜日、参加します！場所と時間が決まったら教えてください。",
    declineMessage: "誘ってくれてありがとう！でも今週は予定があって難しいんだ。また次の機会に誘ってね！",
    time: "15分前",
  },
];

// カレンダーイベント（日付ベース）
const CALENDAR_EVENTS: Record<string, { title: string; color: string; icon?: string }[]> = {
  "2025-01-01": [{ title: "元日", color: "purple", icon: "⭐" }],
  "2025-01-12": [{ title: "成人の", color: "purple", icon: "⭐" }],
  "2025-01-15": [{ title: "かいざ", color: "gray", icon: "🎁" }],
  "2025-01-18": [{ title: "今村さ", color: "gray", icon: "🎁" }],
  "2025-01-20": [{ title: "月次報告", color: "blue", icon: "📅" }],
  "2025-01-25": [{ title: "四半期", color: "blue", icon: "📅" }],
  "2025-01-27": [{ title: "MTG", color: "green", icon: "🎯" }],
  "2025-01-31": [{ title: "締切", color: "red", icon: "⚠️" }],
};

// 1日のスケジュール（時間ベース）
const DAILY_SCHEDULE: Record<string, { time: string; title: string; app: string }[]> = {
  "2025-01-25": [
    { time: "09:00", title: "朝のルーティン", app: "ヘルスケア" },
    { time: "10:00", title: "チームスタンドアップ", app: "Zoom" },
    { time: "12:00", title: "ランチ", app: "" },
    { time: "14:00", title: "四半期レビュー", app: "Teams" },
    { time: "16:00", title: "1on1 with 田中さん", app: "Zoom" },
    { time: "18:00", title: "ジム", app: "ヘルスケア" },
  ],
};

// 天気データ（ダミー）
const WEATHER_DATA: Record<string, { temp: string; condition: string; icon: string }> = {
  "2025-01-25": { temp: "8°C", condition: "晴れ", icon: "☀️" },
  "2025-01-26": { temp: "6°C", condition: "曇り", icon: "☁️" },
  "2025-01-27": { temp: "4°C", condition: "雨", icon: "🌧️" },
};

// カレンダーヘルパー関数
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];

  // 前月の空白
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // 当月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const CAPABILITIES = [
  {
    id: "talk",
    name: "会話する",
    icon: "💬",
    apps: [
      { name: "Maestro", capability: "タスク管理・AIオーケストレーション", isMain: true, charId: "conductor" },
      { name: "Coda", capability: "ドキュメント・チャット統合", charId: "coder" },
      { name: "Memori", capability: "AI会話・記憶管理", charId: "memory" },
    ],
  },
  {
    id: "create",
    name: "作る",
    icon: "🛠️",
    apps: [
      { name: "Claude Code", capability: "AIコーディング・開発支援" },
      { name: "Codex", capability: "コード生成・自動補完" },
      { name: "Manus", capability: "AIエージェント・タスク実行" },
    ],
  },
  {
    id: "send",
    name: "送る",
    icon: "📤",
    apps: [
      { name: "Gmail", capability: "メールの作成・送信" },
      { name: "LINE", capability: "メッセージ・スタンプを送信" },
      { name: "Messenger", capability: "写真・動画を送信" },
    ],
  },
  {
    id: "search",
    name: "探す",
    icon: "🔍",
    apps: [
      { name: "Google", capability: "ウェブ検索・画像検索" },
      { name: "Amazon", capability: "商品検索・購入" },
    ],
  },
  {
    id: "pay",
    name: "支払う",
    icon: "💳",
    apps: [
      { name: "PayPay", capability: "QRコード決済・送金" },
      { name: "Suica", capability: "交通系IC決済" },
      { name: "Apple Pay", capability: "タッチ決済" },
    ],
  },
  {
    id: "remember",
    name: "記憶",
    icon: "🧠",
    apps: [
      { name: "メモ", capability: "テキスト・メモの保存" },
      { name: "Obsidian", capability: "ナレッジベース構築" },
      { name: "Google フォト", capability: "写真・動画の保存・整理" },
    ],
  },
  {
    id: "other",
    name: "その他",
    icon: "⋯",
    apps: [
      { name: "Spotify", capability: "音楽再生・プレイリスト管理" },
      { name: "X", capability: "投稿・タイムライン閲覧" },
      { name: "ヘルスケア", capability: "健康データ管理・記録" },
    ],
  },
];

type MobileTab = "schedule" | "chat" | "profile" | "notifications";
type ProfileSection = "main" | "capabilities" | "settings" | "model";

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [processedCards, setProcessedCards] = useState<string[]>([]);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [jumpingChar, setJumpingChar] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [profileSection, setProfileSection] = useState<ProfileSection>("main");
  const [refreshedSuggestions, setRefreshedSuggestions] = useState<Record<string, { suggestedAction: string; declineMessage: string }>>({});
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCharacterClick = (charId: string) => {
    setJumpingChar(charId);
    setTimeout(() => setJumpingChar(null), 500);
  };

  const currentCard = LIVE_CONTEXT.filter(item => !processedCards.includes(item.id))[0];

  // 効果音を再生する関数
  const playSound = (type: "yes" | "no") => {
    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "yes") {
      // YES: 上昇音（明るい音）
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.type = "sine";
    } else {
      // NO: 下降音（落ち着いた音）
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.1);
      oscillator.type = "sine";
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentCard) return;

    // 効果音を再生
    playSound(direction === "right" ? "yes" : "no");

    setSwipeDirection(direction);

    const currentSuggestions = refreshedSuggestions[currentCard.id] || {
      suggestedAction: currentCard.suggestedAction,
      declineMessage: currentCard.declineMessage,
    };

    setTimeout(() => {
      if (direction === "right") {
        console.log("YES - 送信:", currentSuggestions.suggestedAction);
      } else {
        console.log("NO - 送信:", currentSuggestions.declineMessage);
      }
      setProcessedCards([...processedCards, currentCard.id]);
      setSwipeDirection(null);
    }, 300);
  };

  const handleRefreshSuggestion = async (type: "accept" | "decline") => {
    if (!currentCard || isRefreshing) return;

    setIsRefreshing(type);

    const currentSuggestions = refreshedSuggestions[currentCard.id] || {
      suggestedAction: currentCard.suggestedAction,
      declineMessage: currentCard.declineMessage,
    };

    const prompt = type === "accept"
      ? `以下の状況に対する承諾の返信文を、元の文章とは少し違う表現で作成してください。フレンドリーで簡潔に。

状況: ${currentCard.summary}
詳細: ${currentCard.content}
元の文章: ${currentSuggestions.suggestedAction}

新しい返信文のみを出力してください。`
      : `以下の状況に対する丁寧なお断りの返信文を、元の文章とは少し違う表現で作成してください。簡潔に。

状況: ${currentCard.summary}
詳細: ${currentCard.content}
元の文章: ${currentSuggestions.declineMessage}

新しい返信文のみを出力してください。`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: selectedModel.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
        setRefreshedSuggestions({
          ...refreshedSuggestions,
          [currentCard.id]: {
            ...currentSuggestions,
            [type === "accept" ? "suggestedAction" : "declineMessage"]: data.response.trim(),
          },
        });
      }
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(null);
    }
  };

  const generateImageForDate = async (dateKey: string) => {
    if (isGeneratingImage) return;

    setIsGeneratingImage(true);
    setImageGenerationError(null);

    try {
      const schedule = DAILY_SCHEDULE[dateKey] || [];
      const events = CALENDAR_EVENTS[dateKey] || [];

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          schedule,
          events,
        }),
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setGeneratedImages((prev) => ({
          ...prev,
          [dateKey]: data.imageUrl,
        }));
      } else {
        setImageGenerationError(data.error || "画像の生成に失敗しました");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      setImageGenerationError(error instanceof Error ? error.message : "画像の生成に失敗しました");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      const assistantMessage: Message = { role: "assistant", content: data.response };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 日付が選択されたときに画像を生成
  useEffect(() => {
    if (selectedDate && selectedDate !== "2025-01-25") {
      // 既に生成済みでない場合のみ生成
      if (!generatedImages[selectedDate] && !isGeneratingImage) {
        generateImageForDate(selectedDate);
      }
    }
  }, [selectedDate, generatedImages, isGeneratingImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") {
        handleSwipe("left");
      } else if (e.key === "ArrowRight") {
        handleSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, processedCards]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* モバイル用ヘッダー */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--primary)]">Mate</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-[var(--muted)]">
              {LIVE_CONTEXT.length - processedCards.length} 件
            </span>
          </div>
        </div>
      </header>

      {/* 左サイドバー - デスクトップ表示 / モバイルでは条件付き表示 */}
      <aside className={`
        ${mobileTab === "schedule" || mobileTab === "notifications" ? "flex" : "hidden"}
        lg:flex
        fixed lg:static inset-0 top-14 bottom-16 lg:top-0 lg:bottom-0
        w-full lg:w-96
        border-r border-[var(--card-border)] bg-[var(--card-bg)] p-2 lg:p-4 flex-col overflow-y-auto
        z-40
      `}>
        {/* カレンダーセクション - モバイルでは予定タブでのみ表示 */}
        <div className={`mb-6 flex-1 flex flex-col ${mobileTab === "schedule" ? "flex" : "hidden"} lg:block`}>
          {selectedDate ? (
            /* 日付詳細ビュー */
            <>
              {/* 戻るボタン */}
              <button
                onClick={() => setSelectedDate(null)}
                className="flex items-center gap-2 mb-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>カレンダーに戻る</span>
              </button>

              {/* 日付と天気 */}
              <div className="flex items-center justify-between mb-4 p-4 rounded-2xl bg-[var(--background)]">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[var(--foreground)]">
                    {new Date(selectedDate).getMonth() + 1}/{new Date(selectedDate).getDate()}
                  </span>
                  <span className="text-lg text-[var(--muted)]">
                    {WEEKDAYS[new Date(selectedDate).getDay()]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">
                    {WEATHER_DATA[selectedDate]?.icon || "☀️"}
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[var(--foreground)]">
                      {WEATHER_DATA[selectedDate]?.temp || "10°C"}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {WEATHER_DATA[selectedDate]?.condition || "晴れ"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 画像 */}
              {selectedDate === "2025-01-25" ? (
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img
                    src="/day-photo-0125.jpg"
                    alt="今日の一枚"
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : generatedImages[selectedDate] ? (
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img
                    src={generatedImages[selectedDate]}
                    alt="今日の一枚"
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : isGeneratingImage ? (
                <div className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-blue-400 to-purple-500 aspect-square flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-3 animate-pulse">🎨</div>
                    <div className="text-sm opacity-80">画像を生成中...</div>
                    <div className="mt-2 flex justify-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              ) : imageGenerationError ? (
                <div className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-red-400 to-red-600 aspect-video flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <div className="text-4xl mb-2">⚠️</div>
                    <div className="text-sm opacity-90 mb-2">画像の生成に失敗しました</div>
                    <button
                      onClick={() => {
                        setImageGenerationError(null);
                        generateImageForDate(selectedDate);
                      }}
                      className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
                    >
                      再試行
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-blue-400 to-purple-500 aspect-video flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-2">🌅</div>
                    <div className="text-sm opacity-80">今日の一枚</div>
                  </div>
                </div>
              )}

              {/* 1日の予定 */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                  今日の予定
                </h3>
                <div className="space-y-2">
                  {(DAILY_SCHEDULE[selectedDate] || [
                    { time: "09:00", title: "予定なし", app: "" }
                  ]).map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-[var(--primary)] font-medium w-14">
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--foreground)]">{item.title}</div>
                          {item.app && (
                            <div className="text-xs text-[var(--muted)]">{item.app}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* カレンダービュー */
            <>
          {/* 月タイトル */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {calendarDate.getMonth() + 1}月
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors text-[var(--muted)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-2 py-1 text-xs rounded-lg hover:bg-[var(--background)] transition-colors text-[var(--muted)]"
              >
                今日
              </button>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-[var(--background)] transition-colors text-[var(--muted)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  index === 0 ? "text-red-400" : index === 6 ? "text-[var(--muted)]" : "text-[var(--muted)]"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          {(() => {
            const calendarDays = getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth());
            const today = new Date();
            const isCurrentMonth = calendarDate.getMonth() === today.getMonth() &&
              calendarDate.getFullYear() === today.getFullYear();

            // 今日が含まれる週の行番号を計算
            let currentWeekRow = -1;
            if (isCurrentMonth) {
              const todayIndex = calendarDays.findIndex(d => d === today.getDate());
              if (todayIndex !== -1) {
                currentWeekRow = Math.floor(todayIndex / 7);
              }
            }

            // 週の数を計算
            const totalWeeks = Math.ceil(calendarDays.length / 7);

            return (
              <div className="flex-1 grid grid-cols-7 gap-px bg-[var(--card-border)] rounded-xl lg:rounded-xl overflow-hidden" style={{ gridTemplateRows: Array(totalWeeks).fill(0).map((_, i) => i === currentWeekRow ? '2fr' : '1fr').join(' ') }}>
                {calendarDays.map((day, index) => {
                  const isToday = day === today.getDate() && isCurrentMonth;
                  const dateKey = day ? `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                  const events = dateKey ? CALENDAR_EVENTS[dateKey] : null;
                  const dayOfWeek = index % 7;
                  const weekRow = Math.floor(index / 7);
                  const isCurrentWeek = weekRow === currentWeekRow;

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (day && dateKey) {
                          setSelectedDate(dateKey);
                        }
                      }}
                      className={`bg-[var(--card-bg)] p-1 lg:p-1 ${
                        day ? "cursor-pointer hover:bg-[var(--background)]" : ""
                      }`}
                    >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center ${
                        isToday
                          ? "bg-red-500 text-white rounded-full"
                          : dayOfWeek === 0
                          ? "text-red-400"
                          : dayOfWeek === 6
                          ? "text-[var(--muted)]"
                          : "text-[var(--foreground)]"
                      }`}>
                        {day}
                      </div>
                      {events && events.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full truncate mb-0.5 ${
                            event.color === "purple"
                              ? "bg-purple-100 text-purple-700 lg:bg-purple-500/20 lg:text-purple-400"
                              : event.color === "gray"
                              ? "bg-gray-100 text-gray-700 lg:bg-gray-500/20 lg:text-gray-400"
                              : event.color === "blue"
                              ? "bg-blue-100 text-blue-700 lg:bg-blue-500/20 lg:text-blue-400"
                              : event.color === "green"
                              ? "bg-green-100 text-green-700 lg:bg-green-500/20 lg:text-green-400"
                              : "bg-red-100 text-red-700 lg:bg-red-500/20 lg:text-red-400"
                          }`}
                        >
                          {event.icon} {event.title}
                        </div>
                      ))}
                    </>
                  )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
            </>
          )}
        </div>

        {/* 今起きていること - モバイルでは通知タブでのみ表示 */}
        <div className={`${mobileTab === "notifications" ? "block" : "hidden"} lg:block`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
              今起きていること
            </h2>
            <span className="text-xs text-[var(--muted)] ml-auto">
              {LIVE_CONTEXT.length - processedCards.length} 件
            </span>
          </div>
        </div>

        {/* スワイプカード - モバイルでは通知タブでのみ表示 */}
        <div className={`flex-1 flex flex-col ${mobileTab === "notifications" ? "flex" : "hidden"} lg:flex`}>
          {currentCard ? (
            <div
              className={`flex-1 flex flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--background)] overflow-hidden transition-all duration-300 ${
                swipeDirection === "right"
                  ? "translate-x-full opacity-0 rotate-12"
                  : swipeDirection === "left"
                  ? "-translate-x-full opacity-0 -rotate-12"
                  : ""
              }`}
            >
              {/* カードヘッダー */}
              <div className="p-4 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentCard.icon}</span>
                  <div>
                    <div className="font-medium">{currentCard.app}</div>
                    <div className="text-xs text-[var(--muted)]">{currentCard.time}</div>
                  </div>
                </div>
              </div>

              {/* 要約 */}
              <div className="p-4 border-b border-[var(--card-border)]">
                <div className="text-xs text-[var(--muted)] mb-1">要約</div>
                <div className="font-medium">{currentCard.summary}</div>
                <div className="text-sm text-[var(--muted)] mt-1">{currentCard.content}</div>
              </div>

              {/* AI提案 */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                  <textarea
                    value={refreshedSuggestions[currentCard.id]?.suggestedAction ?? currentCard.suggestedAction}
                    onChange={(e) => {
                      setRefreshedSuggestions({
                        ...refreshedSuggestions,
                        [currentCard.id]: {
                          suggestedAction: e.target.value,
                          declineMessage: refreshedSuggestions[currentCard.id]?.declineMessage ?? currentCard.declineMessage,
                        },
                      });
                    }}
                    className="w-full text-sm leading-relaxed text-green-600 lg:text-green-400 bg-transparent resize-none focus:outline-none"
                    rows={3}
                  />
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-2">
                    <textarea
                      value={refreshedSuggestions[currentCard.id]?.declineMessage ?? currentCard.declineMessage}
                      onChange={(e) => {
                        setRefreshedSuggestions({
                          ...refreshedSuggestions,
                          [currentCard.id]: {
                            suggestedAction: refreshedSuggestions[currentCard.id]?.suggestedAction ?? currentCard.suggestedAction,
                            declineMessage: e.target.value,
                          },
                        });
                      }}
                      className="flex-1 text-sm leading-relaxed text-red-600 lg:text-red-400 bg-transparent resize-none focus:outline-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleRefreshSuggestion("decline")}
                      disabled={isRefreshing !== null}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      title="文章をリフレッシュ"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-red-600 lg:text-red-400 ${isRefreshing === "decline" ? "animate-spin" : ""}`}
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* スワイプボタン */}
              <div className="p-4 flex gap-3">
                <button
                  onClick={() => handleSwipe("left")}
                  className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  NO
                </button>
                <button
                  onClick={() => handleSwipe("right")}
                  className="flex-1 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  YES
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
              <div className="text-center">
                <div className="text-4xl mb-2">✨</div>
                <div>すべて完了しました</div>
              </div>
            </div>
          )}
        </div>

      </aside>

      {/* メインコンテンツエリア */}
      <main className={`
        ${mobileTab === "chat" ? "flex" : "hidden"}
        lg:flex
        flex-1 flex-col p-4 lg:p-8
        pt-20 pb-20 lg:pt-8 lg:pb-8
      `}>
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          {/* メッセージがある場合は会話表示、ない場合はキャラクター表示 */}
          {messages.length > 0 ? (
            // 会話表示
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--card-bg)] border border-[var(--card-border)]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            // キャラクター表示
            <div className="flex-1 flex flex-col items-center justify-center mb-6">
              <div className="flex items-end justify-center gap-4">
                {/* 選択されたキャラクターのみ表示 or 全員表示 */}
                {selectedCharacter ? (
                  // 選択されたキャラクターを中央に大きく表示
                  <div
                    className={`relative cursor-pointer transition-all duration-300 ${jumpingChar === selectedCharacter ? "animate-jump" : ""}`}
                    onClick={() => {
                      handleCharacterClick(selectedCharacter);
                      setSelectedCharacter(null);
                    }}
                  >
                    <img
                      src={
                        selectedCharacter === "conductor" ? "/conductor.png" :
                        selectedCharacter === "coder" ? "/CoderAI.png" :
                        "/MemoryAI.png"
                      }
                      alt={
                        selectedCharacter === "conductor" ? "Maestro" :
                        selectedCharacter === "coder" ? "Coda" :
                        "Memori"
                      }
                      className="w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] object-contain transition-all duration-300"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-[var(--muted)]">
                      タップで全員表示に戻る
                    </div>
                  </div>
                ) : (
                  // 全員表示
                  <>
                    {/* MemoryAI - 左 (Memori) */}
                    <div
                      className={`relative cursor-pointer transition-transform ${jumpingChar === "memory" ? "animate-jump" : ""}`}
                      onClick={() => handleCharacterClick("memory")}
                    >
                      <img
                        src="/MemoryAI.png"
                        alt="Memori"
                        className="w-[130px] h-[130px] sm:w-[220px] sm:h-[220px] lg:w-[358px] lg:h-[358px] object-contain"
                      />
                    </div>

                    {/* ConductorAI - 中央 (Maestro) */}
                    <div
                      className={`relative self-end cursor-pointer transition-transform ${jumpingChar === "conductor" ? "animate-jump" : ""}`}
                      onClick={() => handleCharacterClick("conductor")}
                    >
                      <img
                        src="/conductor.png"
                        alt="Maestro"
                        className="w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] lg:w-[614px] lg:h-[614px] object-contain object-bottom"
                      />
                    </div>

                    {/* CoderAI - 右 (Coda) */}
                    <div
                      className={`relative cursor-pointer transition-transform ${jumpingChar === "coder" ? "animate-jump" : ""}`}
                      onClick={() => handleCharacterClick("coder")}
                    >
                      <img
                        src="/CoderAI.png"
                        alt="Coda"
                        className="w-[130px] h-[130px] sm:w-[220px] sm:h-[220px] lg:w-[358px] lg:h-[358px] object-contain"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 入力エリア */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="w-full p-4 pr-12 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--muted)] resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-3 p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* 右サイドバー - できること（デスクトップのみ） */}
      <aside className="hidden lg:flex lg:static lg:w-80 border-l border-[var(--card-border)] bg-[var(--card-bg)] p-4 overflow-y-auto flex-col">
        <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
          できること
        </h2>

        {/* カテゴリボタン */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CAPABILITIES.map((cap) => (
            <button
              key={cap.id}
              onClick={() => setSelectedCapability(selectedCapability === cap.id ? null : cap.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCapability === cap.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--card-border)] hover:border-[var(--primary)]"
              }`}
            >
              <span className="text-xl">{cap.icon}</span>
              <div className="text-sm font-medium mt-1">{cap.name}</div>
            </button>
          ))}
        </div>

        {/* 選択したカテゴリのアプリ一覧 */}
        {selectedCapability && (
          <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
            <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">
              {selectedCapability === "talk"
                ? "会話できるキャラ"
                : `${CAPABILITIES.find((c) => c.id === selectedCapability)?.name}に使えるアプリ`}
            </h3>
            <div className="space-y-2">
              {CAPABILITIES.find((c) => c.id === selectedCapability)?.apps.map((app, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if ('charId' in app && app.charId) {
                      setSelectedCharacter(app.charId as string);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                    'charId' in app && app.charId === selectedCharacter
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--card-border)] hover:border-[var(--primary)]"
                  }`}
                >
                  <div className="font-medium text-sm">{app.name}</div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {app.capability}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* モバイル用プロフィール画面 */}
      <aside className={`
        ${mobileTab === "profile" ? "flex" : "hidden"}
        lg:hidden
        fixed inset-0 top-14 bottom-16
        w-full
        bg-[var(--card-bg)] p-4 flex-col overflow-y-auto
        z-40
      `}>
        {profileSection === "main" && (
          <>
            {/* プロフィールヘッダー */}
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[var(--background)]">
              <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-2xl text-white">
                👤
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">ユーザー</h2>
                <p className="text-sm text-[var(--muted)]">user@example.com</p>
              </div>
            </div>

            {/* メニュー */}
            <div className="space-y-2">
              <button
                onClick={() => setProfileSection("capabilities")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">⚡</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">できること</div>
                  <div className="text-xs text-[var(--muted)]">アプリ連携・機能一覧</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                onClick={() => setProfileSection("model")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">🤖</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">AIモデル</div>
                  <div className="text-xs text-[var(--muted)]">{selectedModel.name} ({selectedModel.provider})</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                onClick={() => setProfileSection("settings")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">⚙️</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">設定</div>
                  <div className="text-xs text-[var(--muted)]">通知・プライバシー・アカウント</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors">
                <span className="text-xl">❓</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">ヘルプ</div>
                  <div className="text-xs text-[var(--muted)]">使い方・よくある質問</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </>
        )}

        {profileSection === "capabilities" && (
          <>
            {/* 戻るボタン */}
            <button
              onClick={() => setProfileSection("main")}
              className="flex items-center gap-2 mb-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>戻る</span>
            </button>

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">できること</h2>

            {/* カテゴリボタン */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CAPABILITIES.map((cap) => (
                <button
                  key={cap.id}
                  onClick={() => setSelectedCapability(selectedCapability === cap.id ? null : cap.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCapability === cap.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--card-border)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="text-xl">{cap.icon}</span>
                  <div className="text-sm font-medium mt-1">{cap.name}</div>
                </button>
              ))}
            </div>

            {/* 選択したカテゴリのアプリ一覧 */}
            {selectedCapability && (
              <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">
                  {selectedCapability === "talk"
                    ? "会話できるキャラ"
                    : `${CAPABILITIES.find((c) => c.id === selectedCapability)?.name}に使えるアプリ`}
                </h3>
                <div className="space-y-2">
                  {CAPABILITIES.find((c) => c.id === selectedCapability)?.apps.map((app, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if ('charId' in app && app.charId) {
                          setSelectedCharacter(app.charId as string);
                          setMobileTab("chat");
                        }
                      }}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                        'charId' in app && app.charId === selectedCharacter
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--card-border)] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="font-medium text-sm">{app.name}</div>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {app.capability}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {profileSection === "settings" && (
          <>
            {/* 戻るボタン */}
            <button
              onClick={() => setProfileSection("main")}
              className="flex items-center gap-2 mb-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>戻る</span>
            </button>

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">設定</h2>

            <div className="space-y-2">
              <div className="p-4 rounded-xl bg-[var(--background)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">通知</div>
                    <div className="text-xs text-[var(--muted)]">プッシュ通知を受け取る</div>
                  </div>
                  <div className="w-12 h-7 bg-[var(--primary)] rounded-full relative">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--background)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">ダークモード</div>
                    <div className="text-xs text-[var(--muted)]">PCのみダークモード</div>
                  </div>
                  <div className="w-12 h-7 bg-[var(--primary)] rounded-full relative">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--background)]">
                <div className="font-medium text-[var(--foreground)]">言語</div>
                <div className="text-xs text-[var(--muted)]">日本語</div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--background)]">
                <div className="font-medium text-[var(--foreground)]">バージョン</div>
                <div className="text-xs text-[var(--muted)]">1.0.0</div>
              </div>
            </div>
          </>
        )}

        {profileSection === "model" && (
          <>
            {/* 戻るボタン */}
            <button
              onClick={() => setProfileSection("main")}
              className="flex items-center gap-2 mb-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>戻る</span>
            </button>

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">AIモデル</h2>

            <div className="space-y-2">
              {LLM_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    selectedModel.id === model.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${selectedModel.id === model.id ? "bg-green-500" : "bg-[var(--muted)]"}`} />
                  <div className="flex-1">
                    <div className="font-medium text-[var(--foreground)]">{model.name}</div>
                    <div className="text-xs text-[var(--muted)]">{model.provider}</div>
                  </div>
                  {selectedModel.id === model.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {/* モバイル用ボトムナビゲーション */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t border-[var(--card-border)]">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => setMobileTab("schedule")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              mobileTab === "schedule"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
            }`}
          >
            <span className="text-xl">📅</span>
            <span className="text-xs">予定</span>
          </button>
          <button
            onClick={() => setMobileTab("notifications")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors relative ${
              mobileTab === "notifications"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
            }`}
          >
            <span className="text-xl">🔔</span>
            <span className="text-xs">通知</span>
            {LIVE_CONTEXT.length - processedCards.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {LIVE_CONTEXT.length - processedCards.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              mobileTab === "chat"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
            }`}
          >
            <span className="text-xl">💬</span>
            <span className="text-xs">チャット</span>
          </button>
          <button
            onClick={() => {
              setMobileTab("profile");
              setProfileSection("main");
            }}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              mobileTab === "profile"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">プロフィール</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
