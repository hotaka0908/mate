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

// ユーザープロファイル（業務時間、ルール、好み）
const USER_PROFILE = {
  name: "ユーザー",
  workHours: { start: "09:00", end: "18:00" },
  workDays: [1, 2, 3, 4, 5], // 月〜金
  rules: [
    "業務時間外の仕事依頼は基本的に断る",
    "上司や重要クライアントからの依頼は優先する",
    "金曜夜は家族との時間を大切にしている",
    "コードレビューは24時間以内に対応する方針",
  ],
  preferences: {
    socialEvents: "moderate", // "love" | "moderate" | "avoid"
    workStyle: "balanced", // "workaholic" | "balanced" | "relaxed"
  },
  currentStatus: {
    busyLevel: "normal", // "free" | "normal" | "busy" | "overloaded"
    mood: "good", // "great" | "good" | "tired" | "stressed"
  },
};

// 人間関係マップ
const RELATIONSHIPS: Record<string, {
  name: string;
  relationship: "boss" | "colleague" | "client" | "friend" | "family" | "acquaintance";
  priority: "high" | "medium" | "low";
  notes?: string;
}> = {
  "田中": {
    name: "田中さん",
    relationship: "colleague",
    priority: "high",
    notes: "同じチームのリーダー。信頼できる先輩。",
  },
  "佐藤": {
    name: "佐藤様",
    relationship: "client",
    priority: "high",
    notes: "重要クライアント。丁寧な対応が必要。",
  },
  "山本": {
    name: "山本さん",
    relationship: "colleague",
    priority: "medium",
    notes: "エンジニアチームのメンバー。",
  },
  "鈴木": {
    name: "鈴木さん",
    relationship: "friend",
    priority: "medium",
    notes: "会社の同期。よく飲みに行く仲。",
  },
};

// 自分のプロフィール情報
const SELF_PROFILE = {
  name: "穂高",
  avatar: "🧑",
  basicInfo: {
    fullName: "穂高",
    dateOfBirth: "2009年8月20日",
    age: 16,
    gender: "男性",
    bloodType: "O型",
  },
  bodyInfo: {
    height: "170cm",
    weight: "60kg",
    shoeSize: "27.0cm",
    eyesight: { left: "1.2", right: "1.0" },
  },
  healthInfo: {
    bloodPressure: { systolic: 115, diastolic: 72 },
    restingHeartRate: 68,
    medications: [
      { name: "なし", dosage: "", timing: "" },
    ],
    allergies: ["なし"],
    chronicConditions: ["なし"],
  },
  contactInfo: {
    email: "user@example.com",
    phone: "090-1234-5678",
    address: "東京都渋谷区",
    emergencyContact: { name: "母", phone: "090-9876-5432" },
  },
  lifestyle: {
    exercise: "週3回（ジム・ランニング）",
    sleep: "平均7時間",
    diet: "バランス型",
    smoking: "なし",
    alcohol: "たまに飲む",
  },
  personality: {
    type: "慎重派・計画型",
    strengths: ["論理的思考", "継続力", "傾聴力"],
    weaknesses: ["優柔不断になりがち", "頼みを断れない"],
    values: ["誠実さ", "成長", "家族との時間"],
    decisionStyle: "情報を集めてから判断したい",
  },
  hobbies: {
    favorites: {
      items: [
        { category: "ラーメン", value: "杉田家の濃厚豚骨醤油ラーメン（麺硬め・味濃いめ・油多め）", emoji: "🍜" },
        { category: "漫画", value: "ワンピース（空島編が特に好き）", emoji: "📖" },
        { category: "人物", value: "イーロン・マスク（何度失敗しても諦めない姿勢に憧れる）", emoji: "🚀" },
      ],
      personalityInsight: "こだわりの強さと冒険心が共存する性格。ラーメンのカスタマイズへの執着に繊細さが、ワンピースの壮大な物語への共感に仲間を大切にする心が、イーロン・マスクへの憧れに「不可能を可能にしたい」という野心が表れている。",
    },
    interests: ["プログラミング", "読書", "映画鑑賞", "ランニング"],
    favoriteGenres: { music: "J-POP・洋楽", movie: "SF・アクション", book: "ビジネス・技術書" },
    recentlyInto: "AIアプリ開発",
  },
  relationships: {
    family: [
      { relation: "父", name: "父", note: "会社員" },
      { relation: "母", name: "母", note: "パート勤務" },
    ],
    closeFriends: [
      { name: "田中", context: "職場の同僚・よく相談する" },
      { name: "佐藤", context: "大学時代の友人" },
    ],
    importantPeople: ["家族", "田中", "佐藤"],
  },
};

// ルーティーン（自動化タスク）
const HABITS = [
  {
    id: "1",
    name: "打ち合わせ後のフォローメール",
    description: "打ち合わせ終了後に議事録と次のアクションをまとめたメールを自動作成・送信",
    trigger: "カレンダーの打ち合わせ終了時",
    app: "Gmail",
    icon: "📧",
    enabled: true,
    category: "コミュニケーション",
  },
  {
    id: "2",
    name: "旅行計画の自動作成",
    description: "カレンダーに旅行予定を入れると、交通手段・宿泊・観光スポットの計画を事前に作成",
    trigger: "旅行予定がカレンダーに追加された時",
    app: "カレンダー",
    icon: "✈️",
    enabled: true,
    category: "プランニング",
  },
  {
    id: "3",
    name: "誕生日のお祝いメッセージ",
    description: "連絡先の誕生日に合わせて、お祝いメッセージを自動作成・送信",
    trigger: "連絡先の誕生日前日",
    app: "LINE",
    icon: "🎂",
    enabled: true,
    category: "コミュニケーション",
  },
  {
    id: "4",
    name: "週次レポートの下書き作成",
    description: "毎週金曜にその週の作業内容をまとめたレポートを自動で下書き作成",
    trigger: "毎週金曜 17:00",
    app: "Slack",
    icon: "📊",
    enabled: false,
    category: "レポート",
  },
  {
    id: "5",
    name: "天気に応じた持ち物リマインド",
    description: "翌日の天気予報を確認し、傘や上着などの持ち物をリマインド",
    trigger: "毎日 22:00",
    app: "通知",
    icon: "🌤️",
    enabled: true,
    category: "日常サポート",
  },
  {
    id: "6",
    name: "お礼メッセージの自動送信",
    description: "食事や贈り物を受けた翌日にお礼のメッセージを自動作成・送信",
    trigger: "チャットで感謝イベントを検知した時",
    app: "LINE",
    icon: "🙏",
    enabled: true,
    category: "コミュニケーション",
  },
];

// 判断履歴の型
type DecisionHistory = {
  id: string;
  app: string;
  summary: string;
  decision: "yes" | "no";
  reason: string;
  timestamp: Date;
};

const LIVE_CONTEXT = [
  {
    id: "1",
    app: "Slack",
    icon: "💬",
    sender: "田中",
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
    sender: "佐藤",
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
    sender: "山本",
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
    sender: "鈴木",
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
type ProfileSection = "main" | "capabilities" | "settings" | "model" | "mode" | "self-profile" | "privacy" | "routine";
type ChatMode = "text" | "voice";
type NotificationMode = "manual" | "auto";

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
  const [chatMode, setChatMode] = useState<ChatMode>("text");
  const [notificationMode, setNotificationMode] = useState<NotificationMode>("manual");
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistory[]>([]);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);

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

  // Realtime API接続関数
  const connectToRealtimeAPI = async () => {
    try {
      console.log("Connecting to Realtime API...");

      // セッショントークンを取得
      const response = await fetch("/api/realtime", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Session token error:", errorData);
        throw new Error(errorData.error || "Failed to get session token");
      }

      const data = await response.json();
      console.log("Session token received:", data);

      if (!data.client_secret?.value) {
        throw new Error("Invalid client_secret received");
      }

      // WebSocket接続
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        ["realtime", `openai-insecure-api-key.${data.client_secret.value}`]
      );

      ws.onopen = () => {
        console.log("Realtime API connected");
        setIsVoiceConnected(true);
        startAudioCapture(ws);
      };

      ws.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        handleRealtimeMessage(messageData);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsVoiceConnected(false);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsVoiceConnected(false);
        setIsListening(false);
        stopAudioCapture();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Connection error:", error);
      setIsVoiceConnected(false);
      alert(`接続エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
    }
  };

  // 音声キャプチャ開始
  const startAudioCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Audio = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio,
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsListening(true);
    } catch (error) {
      console.error("Audio capture error:", error);
    }
  };

  // 音声キャプチャ停止
  const stopAudioCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  // 切断
  const disconnectFromRealtimeAPI = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setIsVoiceConnected(false);
    setIsSpeaking(false);
  };

  // Realtime APIメッセージハンドラ
  const handleRealtimeMessage = (data: { type: string; delta?: string; transcript?: string; item?: { content?: Array<{ transcript?: string; text?: string }> } }) => {
    switch (data.type) {
      case "response.audio.delta":
        // 音声データを再生
        if (data.delta) {
          playAudioDelta(data.delta);
          setIsSpeaking(true);
        }
        break;

      case "response.audio.done":
        setIsSpeaking(false);
        break;

      case "conversation.item.input_audio_transcription.completed":
        // ユーザーの音声がテキスト化された
        if (data.transcript) {
          setMessages(prev => [...prev, { role: "user", content: data.transcript as string }]);
        }
        break;

      case "response.audio_transcript.done":
        // AIの応答がテキスト化された
        if (data.transcript) {
          const transcriptText = data.transcript;
          setMessages(prev => [...prev, { role: "assistant", content: transcriptText }]);
        }
        break;

      case "response.done":
        // レスポンス完了時に最終テキストを取得
        if (data.item?.content) {
          const textContent = data.item.content.find((c: { transcript?: string; text?: string }) => c.transcript || c.text);
          if (textContent && (textContent.transcript || textContent.text)) {
            // 既に追加されていない場合のみ追加
          }
        }
        break;

      default:
        // その他のイベントはログのみ
        if (data.type !== "input_audio_buffer.speech_started" &&
            data.type !== "input_audio_buffer.speech_stopped" &&
            data.type !== "input_audio_buffer.committed") {
          console.log("Realtime event:", data.type);
        }
    }
  };

  // 音声再生
  const playAudioDelta = async (base64Audio: string) => {
    try {
      const audioData = base64ToArrayBuffer(base64Audio);
      audioQueueRef.current.push(audioData);

      if (audioQueueRef.current.length === 1) {
        playNextInQueue();
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) return;

    const audioData = audioQueueRef.current[0];

    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const pcmData = new Int16Array(audioData);
      const floatData = new Float32Array(pcmData.length);

      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768;
      }

      const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => {
        audioQueueRef.current.shift();
        if (audioQueueRef.current.length > 0) {
          playNextInQueue();
        }
      };
      source.start();
    } catch (error) {
      console.error("Audio queue playback error:", error);
      audioQueueRef.current.shift();
      if (audioQueueRef.current.length > 0) {
        playNextInQueue();
      }
    }
  };

  // ヘルパー関数
  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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

  // Auto モード: AIが自動で判断
  const handleAutoDecision = async () => {
    if (!currentCard || isAutoProcessing) return;

    setIsAutoProcessing(true);

    // 送信者の関係性を取得
    const senderKey = 'sender' in currentCard ? (currentCard as typeof currentCard & { sender?: string }).sender : undefined;
    const senderRelationship = senderKey ? RELATIONSHIPS[senderKey] : null;

    // 今日の日付とスケジュールを取得
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todaySchedule = DAILY_SCHEDULE[todayKey] || [];
    const todayEvents = CALENDAR_EVENTS[todayKey] || [];

    // 現在時刻が業務時間内かチェック
    const currentHour = today.getHours();
    const workStart = parseInt(USER_PROFILE.workHours.start.split(':')[0]);
    const workEnd = parseInt(USER_PROFILE.workHours.end.split(':')[0]);
    const isWorkHours = currentHour >= workStart && currentHour < workEnd;
    const isWorkDay = USER_PROFILE.workDays.includes(today.getDay());

    // 過去の判断履歴をフォーマット
    const recentHistory = decisionHistory.slice(-5).map(h =>
      `- ${h.app}「${h.summary}」→ ${h.decision.toUpperCase()} (理由: ${h.reason})`
    ).join('\n');

    const prompt = `あなたはユーザーのパーソナルアシスタントです。以下のユーザー情報と通知内容を総合的に判断して、「承諾」すべきか「お断り」すべきかを決定してください。

## ユーザープロファイル
- 名前: ${USER_PROFILE.name}
- 業務時間: ${USER_PROFILE.workHours.start} 〜 ${USER_PROFILE.workHours.end}
- 現在の状態: ${USER_PROFILE.currentStatus.busyLevel === 'busy' ? '忙しい' : USER_PROFILE.currentStatus.busyLevel === 'overloaded' ? '非常に忙しい' : '通常'}
- 気分: ${USER_PROFILE.currentStatus.mood === 'tired' ? '疲れている' : USER_PROFILE.currentStatus.mood === 'stressed' ? 'ストレスを感じている' : '良好'}
- 社交イベントへの姿勢: ${USER_PROFILE.preferences.socialEvents === 'love' ? '積極的' : USER_PROFILE.preferences.socialEvents === 'avoid' ? '控えめ' : '普通'}

## ユーザーのルール・方針
${USER_PROFILE.rules.map(r => `- ${r}`).join('\n')}

## 現在の状況
- 現在時刻: ${today.toLocaleTimeString('ja-JP')}
- 今日は: ${isWorkDay ? '業務日' : '休日'}
- 業務時間${isWorkHours ? '内' : '外'}

## 今日のスケジュール
${todaySchedule.length > 0 ? todaySchedule.map(s => `- ${s.time} ${s.title}`).join('\n') : '予定なし'}

## 今日のイベント
${todayEvents.length > 0 ? todayEvents.map(e => `- ${e.title}`).join('\n') : 'イベントなし'}

## 送信者との関係
${senderRelationship ? `
- 名前: ${senderRelationship.name}
- 関係: ${senderRelationship.relationship === 'boss' ? '上司' : senderRelationship.relationship === 'client' ? 'クライアント' : senderRelationship.relationship === 'colleague' ? '同僚' : senderRelationship.relationship === 'friend' ? '友人' : senderRelationship.relationship === 'family' ? '家族' : '知人'}
- 優先度: ${senderRelationship.priority === 'high' ? '高' : senderRelationship.priority === 'medium' ? '中' : '低'}
${senderRelationship.notes ? `- メモ: ${senderRelationship.notes}` : ''}
` : '（送信者情報なし）'}

## 過去の判断履歴
${recentHistory || '（履歴なし）'}

## 今回の通知
- 通知元アプリ: ${currentCard.app}
- 要約: ${currentCard.summary}
- 詳細: ${currentCard.content}

上記の情報を総合的に判断して、ユーザーに代わって返答してください。
回答は以下のJSON形式で答えてください：
{"decision": "YES" または "NO", "reason": "判断理由を簡潔に"}`;

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
        let isYes = false;
        let reason = "";

        try {
          // JSONをパース
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            isYes = parsed.decision?.toUpperCase() === "YES";
            reason = parsed.reason || "";
          } else {
            // フォールバック: 単純な文字列判定
            isYes = data.response.toUpperCase().includes("YES");
            reason = "自動判定";
          }
        } catch {
          isYes = data.response.toUpperCase().includes("YES");
          reason = "自動判定";
        }

        // 判断履歴を保存
        setDecisionHistory(prev => [...prev, {
          id: currentCard.id,
          app: currentCard.app,
          summary: currentCard.summary,
          decision: isYes ? "yes" : "no",
          reason: reason,
          timestamp: new Date(),
        }]);

        console.log(`Auto Decision: ${isYes ? "YES" : "NO"} - ${reason}`);

        // 少し待ってからスワイプアニメーションを実行
        setTimeout(() => {
          handleSwipe(isYes ? "right" : "left");
        }, 500);
      }
    } catch (error) {
      console.error("Auto decision error:", error);
    } finally {
      setIsAutoProcessing(false);
    }
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

  // Autoモードで未処理カードがあるとき自動判断を実行
  useEffect(() => {
    if (notificationMode === "auto" && currentCard && !isAutoProcessing && !swipeDirection) {
      const timer = setTimeout(() => {
        handleAutoDecision();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notificationMode, currentCard, isAutoProcessing, swipeDirection, processedCards]);

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
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-[var(--muted)]">
                {LIVE_CONTEXT.length - processedCards.length} 件
              </span>
              <div className="flex rounded-lg overflow-hidden border border-[var(--card-border)]">
                <button
                  onClick={() => setNotificationMode("manual")}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    notificationMode === "manual"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setNotificationMode("auto")}
                  className={`px-2 py-1 text-xs font-medium transition-colors ${
                    notificationMode === "auto"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Auto
                </button>
              </div>
            </div>
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
                  <div className="flex-1">
                    <div className="font-medium">{currentCard.app}</div>
                    <div className="text-xs text-[var(--muted)]">{currentCard.time}</div>
                  </div>
                  {notificationMode === "auto" && isAutoProcessing && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                      <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
                      <span className="text-xs text-[var(--primary)]">AI判断中...</span>
                    </div>
                  )}
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
          {chatMode === "text" ? (
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
          ) : (
            /* おしゃべりモード */
            <div className="flex flex-col items-center gap-4">
              {/* 接続状態表示 */}
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${isVoiceConnected ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-[var(--muted)]">
                  {isVoiceConnected
                    ? isSpeaking
                      ? "AIが話しています..."
                      : isListening
                      ? "聞いています..."
                      : "接続中"
                    : "未接続"}
                </span>
              </div>

              {/* 音声波形アニメーション */}
              {isVoiceConnected && (isListening || isSpeaking) && (
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isSpeaking ? "bg-amber-500" : "bg-[var(--primary)]"
                      }`}
                      style={{
                        height: `${Math.random() * 32 + 8}px`,
                        animation: `soundWave 0.5s ease-in-out infinite`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* マイクボタン */}
              <button
                onClick={() => {
                  if (isVoiceConnected) {
                    disconnectFromRealtimeAPI();
                  } else {
                    connectToRealtimeAPI();
                  }
                }}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isVoiceConnected
                    ? isSpeaking
                      ? "bg-amber-500 scale-110"
                      : "bg-green-500 scale-105 animate-pulse"
                    : "bg-[var(--primary)] hover:scale-105"
                }`}
              >
                {isVoiceConnected ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>

              <p className="text-sm text-[var(--muted)]">
                {isVoiceConnected ? "タップして終了" : "タップして話す"}
              </p>
            </div>
          )}
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
            {/* プロフィールヘッダー - クリックで自分の詳細情報を表示 */}
            <button
              onClick={() => setProfileSection("self-profile")}
              className="w-full flex items-center gap-4 mb-6 p-4 rounded-2xl bg-[var(--background)] hover:bg-[var(--card-border)] transition-colors text-left"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-2xl text-white">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[var(--foreground)]">ユーザー</h2>
                <p className="text-sm text-[var(--muted)]">user@example.com</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* メニュー */}
            <div className="space-y-2">
              <button
                onClick={() => setProfileSection("privacy")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">🔒</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">プライバシー</div>
                  <div className="text-xs text-[var(--muted)]">身体・健康・連絡先・生活習慣</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <button
                onClick={() => setProfileSection("routine")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">🔄</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">ルーティーン</div>
                  <div className="text-xs text-[var(--muted)]">ワークスタイル・自動化タスク</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted)]">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

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
                onClick={() => setProfileSection("mode")}
                className="w-full p-4 rounded-xl bg-[var(--background)] flex items-center gap-3 hover:bg-[var(--card-border)] transition-colors"
              >
                <span className="text-xl">🎙️</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-[var(--foreground)]">モード</div>
                  <div className="text-xs text-[var(--muted)]">{chatMode === "text" ? "テキストモード" : "おしゃべりモード"}</div>
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

        {profileSection === "privacy" && (
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

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span>🔒</span> プライバシー
            </h2>

            {/* 身体情報 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>📏</span> 身体情報
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted)]">身長</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{SELF_PROFILE.bodyInfo.height}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted)]">体重</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{SELF_PROFILE.bodyInfo.weight}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted)]">靴のサイズ</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">{SELF_PROFILE.bodyInfo.shoeSize}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-xs text-[var(--muted)]">視力</div>
                  <div className="text-lg font-bold text-[var(--foreground)]">
                    <span className="text-xs text-[var(--muted)]">左</span>{SELF_PROFILE.bodyInfo.eyesight.left} <span className="text-xs text-[var(--muted)]">右</span>{SELF_PROFILE.bodyInfo.eyesight.right}
                  </div>
                </div>
              </div>
            </div>

            {/* 健康情報 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>❤️</span> 健康情報
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">血圧</div>
                  <div className="text-sm font-bold text-[var(--foreground)]">
                    {SELF_PROFILE.healthInfo.bloodPressure.systolic}/{SELF_PROFILE.healthInfo.bloodPressure.diastolic} mmHg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">安静時心拍数</div>
                  <div className="text-sm font-bold text-[var(--foreground)]">{SELF_PROFILE.healthInfo.restingHeartRate} bpm</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-1">服用中の薬</div>
                  {SELF_PROFILE.healthInfo.medications.map((med, i) => (
                    <div key={i} className="text-sm text-[var(--muted)]">
                      {med.name}{med.dosage && ` - ${med.dosage}`}{med.timing && `（${med.timing}）`}
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">アレルギー</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.healthInfo.allergies.join("、")}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">持病</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.healthInfo.chronicConditions.join("、")}</div>
                </div>
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>📞</span> 連絡先
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">メール</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.contactInfo.email}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">電話番号</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.contactInfo.phone}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">住所</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.contactInfo.address}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-1">緊急連絡先</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.contactInfo.emergencyContact.name}：{SELF_PROFILE.contactInfo.emergencyContact.phone}</div>
                </div>
              </div>
            </div>

            {/* 生活習慣 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>🏃</span> 生活習慣
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">運動</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.lifestyle.exercise}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">睡眠</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.lifestyle.sleep}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">食生活</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.lifestyle.diet}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">喫煙</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.lifestyle.smoking}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">飲酒</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.lifestyle.alcohol}</div>
                </div>
              </div>
            </div>

          </>
        )}

        {profileSection === "routine" && (
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

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <span>🔄</span> ルーティーン
            </h2>

            {/* ワークスタイル */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>💼</span> ワークスタイル
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">業務時間</div>
                  <div className="text-sm font-bold text-[var(--primary)]">{USER_PROFILE.workHours.start} 〜 {USER_PROFILE.workHours.end}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">コンディション</div>
                  <div className="text-sm text-[var(--muted)]">
                    {USER_PROFILE.currentStatus.mood === "great" ? "最高" : USER_PROFILE.currentStatus.mood === "good" ? "良好" : USER_PROFILE.currentStatus.mood === "tired" ? "疲れ気味" : "ストレスあり"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">忙しさ</div>
                  <div className="text-sm text-[var(--muted)]">
                    {USER_PROFILE.currentStatus.busyLevel === "free" ? "余裕あり" : USER_PROFILE.currentStatus.busyLevel === "normal" ? "通常" : USER_PROFILE.currentStatus.busyLevel === "busy" ? "忙しい" : "超多忙"}
                  </div>
                </div>
              </div>
            </div>

            {/* ルーティーン一覧 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[var(--muted)] flex items-center gap-2">
                  <span>⚡</span> 自動化タスク
                </h3>
                <div className="text-xs text-[var(--muted)]">
                  {HABITS.filter(h => h.enabled).length}/{HABITS.length} 有効
                </div>
              </div>
              <div className="space-y-2">
                {HABITS.map((habit) => (
                  <div key={habit.id} className={`p-3 rounded-xl bg-[var(--background)] border ${habit.enabled ? "border-[var(--primary)]/30" : "border-[var(--card-border)] opacity-50"}`}>
                    <div className="flex items-start gap-2.5">
                      <div className="text-lg mt-0.5">{habit.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium text-[var(--foreground)]">{habit.name}</div>
                          <div className={`w-8 h-4.5 rounded-full flex items-center transition-colors ${habit.enabled ? "bg-[var(--primary)] justify-end" : "bg-[var(--card-border)] justify-start"}`}>
                            <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5" />
                          </div>
                        </div>
                        <div className="text-xs text-[var(--muted)] mb-1.5 leading-relaxed">{habit.description}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 lg:text-blue-400 flex items-center gap-1">
                            <span className="text-[10px]">⚡</span> {habit.trigger}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">
                            {habit.app}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

        {profileSection === "mode" && (
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

            <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">モード</h2>

            <div className="space-y-3">
              <button
                onClick={() => setChatMode("text")}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  chatMode === "text"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💬</span>
                  <div className="flex-1">
                    <div className="font-medium text-[var(--foreground)]">テキストモード</div>
                    <div className="text-xs text-[var(--muted)] mt-1">キーボードで入力してチャット</div>
                  </div>
                  {chatMode === "text" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>

              <button
                onClick={() => setChatMode("voice")}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  chatMode === "voice"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--primary)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎙️</span>
                  <div className="flex-1">
                    <div className="font-medium text-[var(--foreground)]">おしゃべりモード</div>
                    <div className="text-xs text-[var(--muted)] mt-1">声で話しかけてリアルタイム会話</div>
                  </div>
                  {chatMode === "voice" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {chatMode === "voice" && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-sm text-amber-600 lg:text-amber-400">
                    おしゃべりモードではマイクボタンをタップして話しかけてください。AIがリアルタイムで音声で応答します。
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {profileSection === "self-profile" && (
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

            {/* プロフィールヘッダー */}
            <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl bg-gradient-to-r from-[var(--primary)]/20 to-amber-600/10 border border-[var(--primary)]/30">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-amber-600 flex items-center justify-center text-3xl text-white shadow-lg">
                {SELF_PROFILE.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">{SELF_PROFILE.basicInfo.fullName}</h2>
                <p className="text-sm text-[var(--muted)]">{SELF_PROFILE.basicInfo.dateOfBirth}生まれ（{SELF_PROFILE.basicInfo.age}歳）</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">{SELF_PROFILE.basicInfo.gender}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{SELF_PROFILE.basicInfo.bloodType}</span>
                </div>
              </div>
            </div>

            {/* 性格・価値観 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>🧠</span> 性格・価値観
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">タイプ</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.personality.type}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">強み</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SELF_PROFILE.personality.strengths.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-600 lg:text-green-400">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">弱み</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SELF_PROFILE.personality.weaknesses.map((w, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 lg:text-amber-400">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">大切にしていること</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SELF_PROFILE.personality.values.map((v, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">{v}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">判断スタイル</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.personality.decisionStyle}</div>
                </div>
              </div>
            </div>

            {/* 趣味・関心 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>🎯</span> 趣味・関心
              </h3>
              <div className="space-y-2">
                {/* 最も好きなもの */}
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--primary)]/20">
                  <div className="text-sm font-medium text-[var(--foreground)] mb-2.5 flex items-center gap-1.5">
                    <span>❤️</span> 最も好きなもの
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {SELF_PROFILE.hobbies.favorites.items.map((fav, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-[var(--card-bg)]">
                        <span className="text-base mt-0.5 shrink-0">{fav.emoji}</span>
                        <div className="min-w-0">
                          <div className="text-[10px] text-[var(--muted)] leading-tight">{fav.category}</div>
                          <div className="text-xs font-medium text-[var(--foreground)] leading-relaxed">{fav.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="text-[10px] font-semibold text-purple-600 lg:text-purple-400 mb-1 flex items-center gap-1">
                      <span>🔮</span> 好みから見える性格傾向
                    </div>
                    <div className="text-xs text-[var(--muted)] leading-relaxed">{SELF_PROFILE.hobbies.favorites.personalityInsight}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">興味があること</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SELF_PROFILE.hobbies.interests.map((h, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)]">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">音楽</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.hobbies.favoriteGenres.music}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">映画</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.hobbies.favoriteGenres.movie}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">本</div>
                  <div className="text-sm text-[var(--muted)]">{SELF_PROFILE.hobbies.favoriteGenres.book}</div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)] flex items-center justify-between">
                  <div className="text-sm text-[var(--foreground)]">最近ハマっていること</div>
                  <div className="text-sm font-bold text-[var(--primary)]">{SELF_PROFILE.hobbies.recentlyInto}</div>
                </div>
              </div>
            </div>

            {/* 人間関係 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[var(--muted)] mb-2 flex items-center gap-2">
                <span>👥</span> 人間関係
              </h3>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">家族</div>
                  {SELF_PROFILE.relationships.family.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="text-sm text-[var(--muted)]">{f.relation}</div>
                      <div className="text-sm text-[var(--muted)]">{f.note}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-[var(--background)]">
                  <div className="text-sm text-[var(--foreground)] mb-2">親しい人</div>
                  {SELF_PROFILE.relationships.closeFriends.map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="text-sm text-[var(--muted)]">{f.name}</div>
                      <div className="text-sm text-[var(--muted)]">{f.context}</div>
                    </div>
                  ))}
                </div>
              </div>
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
