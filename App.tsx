// アプリのルート。状態ベースの簡易画面遷移で
// 入力 → レポート、および設定 を切り替える。

import React, { useEffect, useState, useCallback, useRef } from "react";
import { StyleSheet, View, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import InputScreen from "./src/screens/InputScreen";
import ReportScreen from "./src/screens/ReportScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { colors } from "./src/theme";
import { ReportInput } from "./src/lib/prompt";
import { generateReport } from "./src/lib/openai";
import {
  loadApiKey,
  loadModel,
  saveApiKey,
  saveModel,
} from "./src/lib/storage";

type Screen = "input" | "report" | "settings";
type ReportStatus = "loading" | "done" | "error";

export default function App() {
  const [screen, setScreen] = useState<Screen>("input");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  const [status, setStatus] = useState<ReportStatus>("loading");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [currentInput, setCurrentInput] = useState<ReportInput | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // 起動時に保存済みの設定を読み込む。
  useEffect(() => {
    (async () => {
      setApiKey(await loadApiKey());
      setModel(await loadModel());
    })();
  }, []);

  const runGeneration = useCallback(
    async (input: ReportInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setReport("");
      setError("");
      try {
        const text = await generateReport({
          apiKey,
          model,
          input,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setReport(text);
        setStatus("done");
      } catch (e: any) {
        if (e?.name === "AbortError" || controller.signal.aborted) return;
        setError(e?.message ?? String(e));
        setStatus("error");
      }
    },
    [apiKey, model]
  );

  const handleSubmit = useCallback(
    (input: ReportInput) => {
      setCurrentInput(input);
      setScreen("report");
      runGeneration(input);
    },
    [runGeneration]
  );

  const handleBack = useCallback(() => {
    abortRef.current?.abort();
    setScreen("input");
  }, []);

  const handleRetry = useCallback(() => {
    if (currentInput) runGeneration(currentInput);
  }, [currentInput, runGeneration]);

  const handleSaveSettings = useCallback(
    async (newKey: string, newModel: string) => {
      setApiKey(newKey);
      setModel(newModel);
      await saveApiKey(newKey);
      await saveModel(newModel);
    },
    []
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.container}>
          {screen === "input" && (
            <InputScreen
              onSubmit={handleSubmit}
              onOpenSettings={() => setScreen("settings")}
              hasApiKey={apiKey.trim().length > 0}
            />
          )}
          {screen === "report" && (
            <ReportScreen
              status={status}
              report={report}
              error={error}
              input={currentInput}
              onBack={handleBack}
              onRetry={handleRetry}
            />
          )}
          {screen === "settings" && (
            <SettingsScreen
              initialApiKey={apiKey}
              initialModel={model}
              onSave={handleSaveSettings}
              onBack={() => setScreen("input")}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
});
