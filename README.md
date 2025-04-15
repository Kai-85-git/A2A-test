# A2A Protocol サイコロボット

このプロジェクトは、Agent-to-Agent (A2A) プロトコルを使用したサイコロを振るAIアシスタントの実装例です。

## 機能

- サイコロを振るAIアシスタントとの対話
- 6面サイコロのランダムな値の生成
- ストリーミングでのAI応答

## 必要条件

- Node.js (v18以上)
- npm (v8以上)
- Google AI API キー

## セットアップ

1. リポジトリをクローンまたはダウンロードします

2. 依存パッケージをインストールします
```bash
npm install
```

3. Google AI APIキーを環境変数に設定します

PowerShellの場合:
```powershell
$env:GOOGLE_GENERATIVE_AI_API_KEY = "あなたのAPIキー"
```

Bashの場合:
```bash
export GOOGLE_GENERATIVE_AI_API_KEY="あなたのAPIキー"
```

## 使用方法

1. サーバーを起動します
```bash
npm run server
```

2. 新しいターミナルを開き、環境変数を設定してからCLIを起動します
```powershell
$env:GOOGLE_GENERATIVE_AI_API_KEY = "あなたのAPIキー"
npx tsx src/cli.ts
```

3. CLIで対話を開始します
```
あなた: こんにちは
AI: こんにちは！サイコロを振るアシスタントです。サイコロを振ってほしい時は、お気軽に言ってください。

あなた: サイコロを振って
AI: はい、サイコロを振ります！標準的な6面サイコロを振りますね。
サイコロを振った結果は3でした！

もう一度振りますか？
```

4. 終了するには `exit` と入力します

## プロジェクト構造

```
.
├── README.md
├── package.json
├── src/
│   ├── cli.ts              # CLIクライアント
│   ├── client.ts           # A2Aクライアント
│   ├── schema.ts           # 型定義
│   └── server/
│       ├── index.ts        # サーバーエントリーポイント
│       ├── agentCard.ts    # エージェント定義
│       └── task.ts         # タスク処理
```

## 技術スタック

- TypeScript
- Hono (Webフレームワーク)
- AI SDK (@ai-sdk/google)
- Zod (バリデーション)

## ライセンス

ISC

## 参考

- [Agent2Agent プロトコル（A2A）](https://azukiazusa.dev/blog/ai-a2a-protocol/)
- [Google Cloud AI](https://cloud.google.com/ai)