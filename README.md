# mate

複数のLLMプロバイダーと会話できるNext.jsアプリケーション。AIキャラクターとのチャット、ライブ通知のスワイプ処理、スケジュール管理を統合したインターフェースを提供します。

## 機能

- **マルチLLM対応**: GPT-5.2（OpenAI）、Opus 4.5（Anthropic）、Gemini 3 Flash（Google）を切り替え可能
- **AIキャラクター**: Maestro、Coda、Memoriの3キャラクターと会話
- **ライブコンテキスト**: Slack、Gmail、GitHub、LINEなどからの通知をスワイプで処理
- **スケジュール表示**: 日/週/月単位で予定を確認

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.local を編集してAPIキーを設定
```

### 必要な環境変数

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 開発

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start
```

## 技術スタック

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- OpenAI SDK
- Anthropic SDK
- Google Generative AI SDK
