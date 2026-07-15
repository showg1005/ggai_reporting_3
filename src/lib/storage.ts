// API キーとモデル設定の永続化。
// 機密情報である API キーは expo-secure-store に安全に保存する。
// Web 実行時は SecureStore が使えないため localStorage にフォールバックする。

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_KEY = "openai_api_key";
const MODEL_KEY = "openai_model";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function saveApiKey(value: string): Promise<void> {
  await setItem(API_KEY, value);
}

export async function loadApiKey(): Promise<string> {
  return (await getItem(API_KEY)) ?? "";
}

export async function saveModel(value: string): Promise<void> {
  await setItem(MODEL_KEY, value);
}

export async function loadModel(): Promise<string> {
  return (await getItem(MODEL_KEY)) ?? "";
}
