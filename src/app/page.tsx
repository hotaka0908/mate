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

const SCHEDULE = {
  day: [
    { id: "1", time: "10:00", title: "チームスタンドアップ", app: "Zoom" },
    { id: "2", time: "14:00", title: "クライアントミーティング", app: "Teams" },
    { id: "3", time: "16:00", title: "1on1 with 田中さん", app: "Zoom" },
  ],
  week: [
    { id: "1", day: "月", title: "週次定例", app: "Zoom" },
    { id: "2", day: "火", title: "デザインレビュー", app: "Figma" },
    { id: "3", day: "水", title: "スプリントプランニング", app: "Notion" },
    { id: "4", day: "木", title: "プロダクトMTG", app: "Teams" },
    { id: "5", day: "金", title: "振り返り", app: "Miro" },
  ],
  month: [
    { id: "1", date: "1/20", title: "月次報告会", app: "Zoom" },
    { id: "2", date: "1/25", title: "四半期レビュー", app: "Teams" },
    { id: "3", date: "1/31", title: "締め切り: プロジェクトA", app: "Notion" },
  ],
};

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

type MobileTab = "schedule" | "chat" | "capabilities" | "notifications";

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [processedCards, setProcessedCards] = useState<string[]>([]);
  const [scheduleView, setScheduleView] = useState<"day" | "week" | "month">("day");
  const [jumpingChar, setJumpingChar] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [refreshedSuggestions, setRefreshedSuggestions] = useState<Record<string, { suggestedAction: string; declineMessage: string }>>({});
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCharacterClick = (charId: string) => {
    setJumpingChar(charId);
    setTimeout(() => setJumpingChar(null), 500);
  };

  const currentCard = LIVE_CONTEXT.filter(item => !processedCards.includes(item.id))[0];

  const handleSwipe = (direction: "left" | "right") => {
    if (!currentCard) return;

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
        border-r border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex-col overflow-y-auto
        z-40
      `}>
        {/* 予定セクション - モバイルでは予定タブでのみ表示 */}
        <div className={`mb-6 ${mobileTab === "schedule" ? "block" : "hidden"} lg:block`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">
              予定
            </h2>
          </div>

          {/* 日/週/月 切り替えタブ */}
          <div className="flex gap-1 mb-3 p-1 rounded-lg bg-[var(--background)]">
            {[
              { key: "day", label: "今日" },
              { key: "week", label: "週" },
              { key: "month", label: "月" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setScheduleView(tab.key as "day" | "week" | "month")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  scheduleView === tab.key
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 予定リスト */}
          <div className="space-y-2">
            {scheduleView === "day" &&
              SCHEDULE.day.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[var(--primary)] font-medium w-12">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-[var(--muted)]">{item.app}</div>
                    </div>
                  </div>
                </div>
              ))}
            {scheduleView === "week" &&
              SCHEDULE.week.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[var(--primary)] font-medium w-12">
                      {item.day}曜
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-[var(--muted)]">{item.app}</div>
                    </div>
                  </div>
                </div>
              ))}
            {scheduleView === "month" &&
              SCHEDULE.month.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-[var(--primary)] font-medium w-12">
                      {item.date}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-[var(--muted)]">{item.app}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
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
                  <div className="flex items-start gap-2">
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
                      className="flex-1 text-sm leading-relaxed text-green-600 lg:text-green-400 bg-transparent resize-none focus:outline-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleRefreshSuggestion("accept")}
                      disabled={isRefreshing !== null}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
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
                        className={`text-green-600 lg:text-green-400 ${isRefreshing === "accept" ? "animate-spin" : ""}`}
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </button>
                  </div>
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
                      className="w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[500px] lg:h-[500px] object-contain transition-all duration-300"
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
                        className="w-[80px] h-[80px] sm:w-[150px] sm:h-[150px] lg:w-[358px] lg:h-[358px] object-contain"
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
                        className="w-[120px] h-[120px] sm:w-[250px] sm:h-[250px] lg:w-[614px] lg:h-[614px] object-contain object-bottom"
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
                        className="w-[80px] h-[80px] sm:w-[150px] sm:h-[150px] lg:w-[358px] lg:h-[358px] object-contain"
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

            {/* モデル切り替え（入力欄の右下） */}
            <div className="flex justify-end mt-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{selectedModel.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${isModelMenuOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* モデル選択ドロップダウン */}
                {isModelMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl overflow-hidden z-10">
                    {LLM_MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[var(--card-border)] transition-colors ${
                          selectedModel.id === model.id ? "bg-[var(--card-border)]" : ""
                        }`}
                      >
                        <div className="text-sm font-medium">{model.name}</div>
                        <div className="text-xs text-[var(--muted)]">{model.provider}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* 右サイドバー - できること */}
      <aside className={`
        ${mobileTab === "capabilities" ? "flex" : "hidden"}
        lg:flex
        fixed lg:static inset-0 top-14 bottom-16 lg:top-0 lg:bottom-0
        w-full lg:w-80
        border-l border-[var(--card-border)] bg-[var(--card-bg)] p-4 overflow-y-auto flex-col
        z-40
      `}>
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
            onClick={() => setMobileTab("capabilities")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              mobileTab === "capabilities"
                ? "text-[var(--primary)]"
                : "text-[var(--muted)]"
            }`}
          >
            <span className="text-xl">⚡</span>
            <span className="text-xs">できること</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
