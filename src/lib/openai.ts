// OpenAI Responses API を直接呼び出し、web_search ツールで
// リアルタイム調査を行いながら人流アノマリー分析レポートを生成する。

import { SYSTEM_PROMPT, buildUserMessage, ReportInput } from "./prompt";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export const DEFAULT_MODEL = "gpt-4.1";

export type GenerateOptions = {
  apiKey: string;
  model?: string;
  input: ReportInput;
  signal?: AbortSignal;
};

/** Responses API の output 配列からテキストと参照URLを抽出する。 */
function extractText(data: any): string {
  // SDK が付与する便宜プロパティがあればそれを優先。
  if (typeof data?.output_text === "string" && data.output_text.length > 0) {
    return data.output_text;
  }

  const parts: string[] = [];
  const output = Array.isArray(data?.output) ? data.output : [];
  for (const item of output) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c?.type === "output_text" && typeof c.text === "string") {
          parts.push(c.text);
        }
      }
    }
  }
  return parts.join("\n\n").trim();
}

function extractErrorMessage(data: any, status: number): string {
  const msg = data?.error?.message;
  if (typeof msg === "string" && msg.length > 0) {
    return msg;
  }
  return `OpenAI API エラー (HTTP ${status})`;
}

/**
 * レポートを生成する。web_search ツールを有効化しているため、
 * モデルは最新ニュース・SNS・災害情報などを検索しながら回答する。
 */
export async function generateReport(options: GenerateOptions): Promise<string> {
  const { apiKey, input, signal } = options;
  const model = options.model?.trim() || DEFAULT_MODEL;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("OpenAI API キーが設定されていません。設定画面から入力してください。");
  }

  const body = {
    model,
    tools: [{ type: "web_search_preview" }],
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(input) },
    ],
  };

  let response: Response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    throw new Error(`ネットワークエラー: ${e?.message ?? String(e)}`);
  }

  let data: any = null;
  const raw = await response.text();
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // JSON でない場合はそのまま扱う。
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  const text = extractText(data);
  if (!text) {
    throw new Error("レポートの本文を取得できませんでした。モデル名や API プランをご確認ください。");
  }
  return text;
}
