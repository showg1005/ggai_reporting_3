// レポート画面: 生成中はローディング、完了後は Markdown を表示する。
// エラー時は再試行、成功時はコピーが可能。

import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import { colors, spacing, radius } from "../theme";
import { ReportInput } from "../lib/prompt";

type Props = {
  status: "loading" | "done" | "error";
  report: string;
  error: string;
  input: ReportInput | null;
  onBack: () => void;
  onRetry: () => void;
};

export default function ReportScreen({
  status,
  report,
  error,
  input,
  onBack,
  onRetry,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← 入力に戻る</Text>
        </TouchableOpacity>
        {status === "done" && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
            <Text style={styles.copyText}>{copied ? "✓ コピー済" : "コピー"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {input && (
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {input.datetime} / 緯度 {input.latitude} / 経度 {input.longitude}
          </Text>
        </View>
      )}

      {status === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            AI が最新情報を調査してレポートを作成しています…
          </Text>
          <Text style={styles.loadingSub}>数十秒〜数分かかる場合があります</Text>
        </View>
      )}

      {status === "error" && (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>生成に失敗しました</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "done" && (
        <ScrollView contentContainerStyle={styles.reportContainer}>
          <Markdown style={markdownStyles}>{report}</Markdown>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  backText: { color: colors.primary, fontSize: 15 },
  copyBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  copyText: { color: colors.text, fontSize: 14 },
  meta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  metaText: { color: colors.textMuted, fontSize: 12 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  loadingSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  errorMsg: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  retryText: { color: colors.primaryText, fontWeight: "700", fontSize: 15 },
  reportContainer: { padding: spacing.lg, paddingBottom: spacing.xl },
});

// react-native-markdown-display 用のダークテーマスタイル。
const markdownStyles = StyleSheet.create({
  body: { color: colors.text, fontSize: 15, lineHeight: 24 },
  heading1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading2: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  link: { color: colors.primary },
  strong: { color: colors.text, fontWeight: "700" },
  bullet_list: { marginVertical: spacing.xs },
  ordered_list: { marginVertical: spacing.xs },
  list_item: { marginVertical: 2 },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },
  code_inline: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  fence: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  table: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    marginVertical: spacing.sm,
  },
  thead: { backgroundColor: colors.surface },
  th: { color: colors.text, padding: spacing.sm, fontWeight: "700" },
  td: { color: colors.text, padding: spacing.sm },
  tr: { borderBottomWidth: 1, borderColor: colors.border },
  hr: { backgroundColor: colors.border, height: 1, marginVertical: spacing.md },
});
