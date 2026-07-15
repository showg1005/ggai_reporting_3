# 人流アノマリー分析アプリ

日時と緯度経度を入力すると、OpenAI が最新ニュース・SNS・災害情報などを Web 検索しながら、
その地点・時刻に発生した「人流のアノマリー（急増）」の原因を分析し、Markdown レポートを生成する
モバイルアプリ（Expo / React Native）です。

## 特徴

- **入力式**: 日時・緯度・経度・（任意で）周辺施設や地形の参考情報を手入力。
- **OpenAI × Web 検索**: OpenAI Responses API の `web_search` ツールを使い、
  リアルタイムのニュース・イベント・災害・SNS 情報を調査して要因を深掘り。
- **データサイエンティスト視点のレポート**: 「事実」と「推定（仮説）」を明確に区別し、
  Where / Why を掘り下げた前向きな Markdown レポートを生成。
- **API キーは端末にセキュア保存**: `expo-secure-store` に保存し、送信先は OpenAI のみ。
  バックエンド不要。

## セットアップ

```bash
# 依存パッケージをインストール（バージョン整合のため expo install を推奨）
npm install

# 開発サーバー起動
npx expo start
```

Expo Go アプリ（iOS / Android）で QR コードを読み取ると実機で確認できます。
`npx expo start --web` でブラウザ確認も可能です。

> 依存パッケージのバージョンが SDK と合わない場合は `npx expo install --fix` で調整してください。

## 使い方

1. 初回起動時、右上の **⚙ 設定** から OpenAI API キーを入力して保存します。
   - API キーは [platform.openai.com](https://platform.openai.com/) で発行できます。
   - モデルは Web 検索対応のもの（既定: `gpt-4.1`）を指定します。
2. 入力画面で **日時 / 緯度 / 経度** を入力します。必要に応じて周辺情報も入力。
3. **レポートを生成** をタップすると、AI が調査を開始します（数十秒〜数分）。
4. 生成されたレポートは画面上で閲覧でき、**コピー** で共有できます。

## 構成

```
App.tsx                  ルート（画面遷移・生成の状態管理）
src/
  screens/
    InputScreen.tsx      日時・緯度経度などの入力
    ReportScreen.tsx     生成中/完了/エラー表示・Markdown レンダリング
    SettingsScreen.tsx   API キー・モデル設定
  lib/
    prompt.ts            システムプロンプトとユーザーメッセージ組み立て
    openai.ts            OpenAI Responses API 呼び出し（web_search 有効化）
    storage.ts           API キー・モデルのセキュア保存
  theme.ts               カラーパレット等
```

## 注意事項

- 生成コストは OpenAI の利用料に依存します（Web 検索ツールの利用料を含む）。
- レポートは AI による分析であり、「推定（仮説）」を含みます。重要な判断は
  出典元の一次情報で確認してください。
