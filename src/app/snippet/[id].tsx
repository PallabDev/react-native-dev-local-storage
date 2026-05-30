import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, View, ActivityIndicator } from "react-native";

import { Button, Pill, useTheme, codeStyle, panelStyle } from "@/components/ui";
import { explainSnippet } from "@/lib/ai";
import { appDirectory, buildSnippetExport, safeFileName, writeTextFile } from "@/lib/file-store";
import {
  addAttachment,
  deleteSnippet,
  getSnippet,
  saveAiResponse,
  toggleFavorite,
} from "@/lib/snippet-store";
import { getAiModel, getApiKey } from "@/lib/preferences";
import type { Snippet } from "@/types/snippet";

type ExportFormat = "txt" | "js" | "json";

function extensionForLanguage(language: string) {
  const lower = language.toLowerCase();
  if (lower.includes("type")) return "ts";
  if (lower.includes("javascript") || lower === "js") return "js";
  if (lower.includes("python")) return "py";
  if (lower.includes("swift")) return "swift";
  if (lower.includes("kotlin")) return "kt";
  if (lower.includes("json")) return "json";
  return "txt";
}

export default function SnippetDetailsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [busyMessage, setBusyMessage] = useState("");

  const refresh = useCallback(async () => {
    setSnippet(await getSnippet(db, Number(id)));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (!snippet) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 18 }}
        style={{ backgroundColor: colors.paper }}
      >
        <Text style={{ color: colors.muted, fontWeight: "600" }} selectable>
          Snippet not found.
        </Text>
      </ScrollView>
    );
  }

  const currentSnippet = snippet;

  async function favorite() {
    await toggleFavorite(db, currentSnippet);
    await refresh();
  }

  async function remove() {
    await deleteSnippet(db, currentSnippet.id);
    router.replace("/");
  }

  async function attachScreenshot() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const target = `${appDirectory}Screenshots/${safeFileName(currentSnippet.title)}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: result.assets[0].uri, to: target });
    await addAttachment(db, currentSnippet, target);
    await refresh();
  }

  async function exportSnippet(format: ExportFormat, share = false) {
    const exported = buildSnippetExport(currentSnippet, format);
    const { uri } = await writeTextFile("Exports", exported.name, exported.content, exported.mimeType);

    if (share) {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing unavailable", "The snippet was still saved to Exports.");
      }
    }
  }

  async function saveCodeFile() {
    const extension = extensionForLanguage(currentSnippet.language);
    await writeTextFile("Resources", `${safeFileName(currentSnippet.title)}.${extension}`, currentSnippet.code, "text/plain");
  }

  async function generateExplanation() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API key needed", "Save an OpenAI API key in Settings first.");
      return;
    }

    setBusyMessage("Generating explanation...");
    try {
      const response = await explainSnippet(currentSnippet, apiKey, await getAiModel());
      await saveAiResponse(db, currentSnippet.id, response);
      await refresh();
    } catch (error) {
      Alert.alert("AI request failed", error instanceof Error ? error.message : "Try again later.");
    } finally {
      setBusyMessage("");
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 18 }}
      style={{ backgroundColor: colors.paper }}
    >
      <View style={[panelStyle, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.ink, fontSize: 22, fontWeight: "900", letterSpacing: 0.1 }} selectable>
            {snippet.title}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <Pill label={snippet.language} language={snippet.language} />
            {snippet.tags.map((tag) => (
              <Pill key={tag} label={tag} />
            ))}
            {snippet.tags.length === 0 && (
              <Text style={{ color: colors.muted, fontSize: 13, fontStyle: "italic" }}>untagged</Text>
            )}
          </View>
        </View>

        <Text
          style={[
            codeStyle,
            {
              backgroundColor: colors.codeBg,
              color: colors.codeText,
              borderColor: colors.line,
              marginVertical: 4,
            },
          ]}
          selectable
        >
          {snippet.code}
        </Text>

        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Link href={{ pathname: "/create-snippet", params: { id: String(snippet.id) } }} asChild>
              <Button label="Edit" tone="secondary" style={{ flexGrow: 1, minWidth: 80 }} />
            </Link>
            <Button
              label={snippet.isFavorite ? "Starred" : "Star"}
              tone="secondary"
              onPress={favorite}
              style={{ flexGrow: 1, minWidth: 100 }}
            />
            <Button
              label="Attach Image"
              tone="secondary"
              onPress={attachScreenshot}
              style={{ flexGrow: 1, minWidth: 140 }}
            />
            <Button
              label="Save File"
              tone="secondary"
              onPress={saveCodeFile}
              style={{ flexGrow: 1, minWidth: 130 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Button
              label="AI Explain"
              onPress={generateExplanation}
              style={{ flex: 1, minWidth: 140 }}
            />
            <Button
              label="Delete"
              tone="danger"
              onPress={remove}
              style={{ flex: 1, minWidth: 100 }}
            />
          </View>
        </View>

        <View style={{ height: 1.5, backgroundColor: colors.line, marginVertical: 4 }} />

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["txt", "js", "json"] as ExportFormat[]).map((format) => (
            <Button
              key={format}
              label={`.${format}`}
              tone="plain"
              onPress={() => exportSnippet(format)}
              style={{ flexGrow: 1, minWidth: 80 }}
            />
          ))}
          <Button
            label="Share Text"
            tone="plain"
            onPress={() => exportSnippet("txt", true)}
            style={{ flexGrow: 2, minWidth: 120 }}
          />
        </View>
      </View>

      {snippet.attachments.length > 0 ? (
        <View style={[panelStyle, { backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={{ color: colors.ink, fontWeight: "800", fontSize: 15, letterSpacing: 0.1 }} selectable>
            📎 Attachments ({snippet.attachments.length})
          </Text>
          <View style={{ gap: 8, marginTop: 4 }}>
            {snippet.attachments.map((uri) => (
              <View
                key={uri}
                style={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  borderCurve: "continuous",
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Text style={{ color: colors.blue, fontSize: 13, fontWeight: "600" }} selectable numberOfLines={1}>
                  {uri.split("/").pop()}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }} selectable numberOfLines={1}>
                  {uri}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {busyMessage ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center", paddingVertical: 12 }}>
          <ActivityIndicator color={theme === "dark" ? "#14b8a6" : colors.accent} />
          <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 14 }} selectable>
            {busyMessage}
          </Text>
        </View>
      ) : null}

      {snippet.aiResponse ? (
        <View
          style={[
            panelStyle,
            {
              backgroundColor: theme === "dark" ? "#0f1524" : "#f0fdfa",
              borderColor: theme === "dark" ? "#312e81" : "#ccfbf1",
              borderWidth: 1.5,
            },
          ]}
        >
          <Text
            style={{
              color: theme === "dark" ? "#2dd4bf" : colors.accent,
              fontWeight: "900",
              fontSize: 15,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
            selectable
          >
            ✨ AI Explanation
          </Text>
          <Text style={{ color: colors.ink, lineHeight: 22, fontSize: 14 }} selectable>
            {snippet.aiResponse}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
