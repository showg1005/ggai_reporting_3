// 設定画面: OpenAI API キーと使用モデルを入力・保存する。
// API キーは端末のセキュアストレージに保存され、外部に送信されるのは
// OpenAI へのリクエスト時のみ。

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { colors, spacing, radius } from "../theme";
import { DEFAULT_MODEL } from "../lib/openai";

type Props = {
  initialApiKey: string;
  initialModel: string;
  onSave: (apiKey: string, model: string) => void;
  onBack: () => void;
};

const MODEL_SUGGESTIONS = ["gpt-4.1", "gpt-4.1-mini", "gpt-4o"];

export default function SettingsScreen({
  initialApiKey,
  initialModel,
  onSave,
  onBack,
}: Props) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [model, setModel] = useState(initialModel || DEFAULT_MODEL);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(apiKey.trim(), model.trim() || DEFAULT_MODEL);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
        <View style={styles.spacer} />
      </View>

      <Text style={styles.label}>OpenAI API キー</Text>
      <View style={styles.keyRow}>
        <TextInput
          style={[styles.input, styles.keyInput]}
          placeholder="sk-..."
          placeholderTextColor={colors.textMuted}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShow((s) => !s)}
          style={styles.showBtn}
        >
          <Text style={styles.showText}>{show ? "隠す" : "表示"}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        キーは端末内のセキュアストレージにのみ保存されます。OpenAI の
        API キーは platform.openai.com で発行できます。
      </Text>

      <Text style={[styles.label, styles.mt]}>モデル</Text>
      <TextInput
        style={styles.input}
        placeholder={DEFAULT_MODEL}
        placeholderTextColor={colors.textMuted}
        value={model}
        onChangeText={setModel}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.chips}>
        {MODEL_SUGGESTIONS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, model === m && styles.chipActive]}
            onPress={() => setModel(m)}
          >
            <Text
              style={[styles.chipText, model === m && styles.chipTextActive]}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>
        Web 検索（web_search）に対応したモデルを指定してください。
      </Text>

      <TouchableOpacity style={styles.save} onPress={handleSave}>
        <Text style={styles.saveText}>{saved ? "✓ 保存しました" : "保存"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  backBtn: { paddingVertical: spacing.xs, paddingRight: spacing.md },
  backText: { color: colors.primary, fontSize: 15 },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  spacer: { flex: 1 },
  label: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: spacing.xs },
  mt: { marginTop: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  keyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  keyInput: { flex: 1 },
  showBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showText: { color: colors.text, fontSize: 14 },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.primaryText, fontWeight: "700" },
  save: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveText: { color: colors.primaryText, fontSize: 16, fontWeight: "700" },
});
