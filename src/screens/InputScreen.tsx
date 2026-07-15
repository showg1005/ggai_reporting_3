// 入力画面: 日時・緯度・経度・参考情報を入力してレポート生成を開始する。

import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, spacing, radius } from "../theme";
import { ReportInput } from "../lib/prompt";

type Props = {
  onSubmit: (input: ReportInput) => void;
  onOpenSettings: () => void;
  hasApiKey: boolean;
};

// 緯度: -90〜90 / 経度: -180〜180 の簡易バリデーション。
function isValidLat(v: string): boolean {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= -90 && n <= 90;
}
function isValidLng(v: string): boolean {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) && n >= -180 && n <= 180;
}

export default function InputScreen({ onSubmit, onOpenSettings, hasApiKey }: Props) {
  const [datetime, setDatetime] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [context, setContext] = useState("");
  const [touched, setTouched] = useState(false);

  const latOk = isValidLat(latitude);
  const lngOk = isValidLng(longitude);
  const datetimeOk = datetime.trim().length > 0;
  const canSubmit = latOk && lngOk && datetimeOk && hasApiKey;

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      datetime: datetime.trim(),
      latitude: latitude.trim(),
      longitude: longitude.trim(),
      context: context.trim(),
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>人流アノマリー分析</Text>
          <TouchableOpacity onPress={onOpenSettings} style={styles.settingsBtn}>
            <Text style={styles.settingsBtnText}>⚙ 設定</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          日時と緯度経度を入力すると、AI が最新ニュース・SNS・災害情報などを調査し、
          人流増加の原因レポートを作成します。
        </Text>

        {!hasApiKey && (
          <TouchableOpacity onPress={onOpenSettings} style={styles.warning}>
            <Text style={styles.warningText}>
              ⚠ OpenAI API キーが未設定です。タップして設定してください。
            </Text>
          </TouchableOpacity>
        )}

        <Field label="日時">
          <TextInput
            style={styles.input}
            placeholder="例: 2026-07-15 19:00 (JST)"
            placeholderTextColor={colors.textMuted}
            value={datetime}
            onChangeText={setDatetime}
            autoCapitalize="none"
          />
          {touched && !datetimeOk && (
            <Text style={styles.error}>日時を入力してください。</Text>
          )}
        </Field>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Field label="緯度 (latitude)">
              <TextInput
                style={styles.input}
                placeholder="例: 35.6595"
                placeholderTextColor={colors.textMuted}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
              {touched && !latOk && (
                <Text style={styles.error}>-90〜90 の数値</Text>
              )}
            </Field>
          </View>
          <View style={styles.rowItem}>
            <Field label="経度 (longitude)">
              <TextInput
                style={styles.input}
                placeholder="例: 139.7005"
                placeholderTextColor={colors.textMuted}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
              />
              {touched && !lngOk && (
                <Text style={styles.error}>-180〜180 の数値</Text>
              )}
            </Field>
          </View>
        </View>

        <Field label="周辺施設・地形などの参考情報（任意）">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="例: 渋谷スクランブル交差点付近。商業施設・オフィスが密集。"
            placeholderTextColor={colors.textMuted}
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>

        <TouchableOpacity
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText}>レポートを生成</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          ※ Web 検索を伴うため、生成には数十秒〜数分かかることがあります。
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  settingsBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  settingsBtnText: { color: colors.text, fontSize: 14 },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  warning: {
    backgroundColor: "#7f1d1d",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  warningText: { color: "#fecaca", fontSize: 14 },
  field: { marginBottom: spacing.md },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
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
  multiline: { minHeight: 96 },
  row: { flexDirection: "row", gap: spacing.md },
  rowItem: { flex: 1 },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "700",
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
