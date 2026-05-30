import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/snippets/empty-state";
import { Button, Pill, useTheme, panelStyle } from "@/components/ui";
import {
  appDirectory,
  copyStoredFile,
  createStarterTemplates,
  deleteStoredFile,
  ensureWorkspace,
  listStoredFiles,
  moveStoredFile,
  safeFileName,
} from "@/lib/file-store";
import type { StoredFile } from "@/types/snippet";

const folders = ["", "Screenshots", "Exports", "Templates", "Resources"];

export default function FileManagerScreen() {
  const { colors, theme } = useTheme();
  const [folder, setFolder] = useState("");
  const [files, setFiles] = useState<StoredFile[]>([]);

  const refresh = useCallback(async () => {
    await ensureWorkspace();
    setFiles(await listStoredFiles(folder));
  }, [folder]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function importResource() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) {
      return;
    }

    const picked = result.assets[0];
    await FileSystem.copyAsync({
      from: picked.uri,
      to: `${appDirectory}Resources/${safeFileName(picked.name)}`,
    });
    await refresh();
  }

  async function downloadTemplates() {
    await createStarterTemplates();
    setFolder("Templates");
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 16 }}
      style={{ backgroundColor: colors.paper }}
    >
      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" }}>
          Folder Navigation
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {folders.map((name) => (
            <Pressable
              key={name || "root"}
              onPress={() => setFolder(name)}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Pill label={name || "All"} active={folder === name} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          label="Import File"
          onPress={importResource}
          style={{ flex: 1, minWidth: 130 }}
        />
        <Button
          label="Add Templates"
          tone="secondary"
          onPress={downloadTemplates}
          style={{ flex: 1, minWidth: 140 }}
        />
      </View>

      <View style={{ gap: 12, marginTop: 4 }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: 0.2 }}>
          {folder || "All"} Directory Files
        </Text>
        {files.length === 0 ? (
          <EmptyState text="No files in this folder yet." />
        ) : (
          files.map((file) => (
            <View
              key={file.uri}
              style={[
                panelStyle,
                {
                  backgroundColor: colors.panel,
                  borderColor: colors.line,
                  gap: 8,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 20 }}>
                  {file.kind === "directory" ? "📁" : "📄"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontWeight: "800", fontSize: 15 }} selectable>
                    {file.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 11,
                      fontVariant: ["tabular-nums"],
                      marginTop: 1,
                    }}
                    selectable
                  >
                    {file.kind === "directory" ? "Directory" : `${file.size} bytes`}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#f1f5f9",
                  padding: 8,
                  borderRadius: 8,
                  borderCurve: "continuous",
                }}
              >
                <Text
                  style={{
                    color: colors.blue,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                  selectable
                  numberOfLines={1}
                >
                  {file.uri}
                </Text>
              </View>

              {file.kind === "file" ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  <Button
                    label="Copy to Resources"
                    tone="secondary"
                    onPress={async () => {
                      await copyStoredFile(file.uri, "Resources");
                      await refresh();
                    }}
                    style={{ flexGrow: 1, minWidth: 120, minHeight: 38 }}
                  />
                  <Button
                    label="Move to Templates"
                    tone="secondary"
                    onPress={async () => {
                      await moveStoredFile(file.uri, "Templates");
                      await refresh();
                    }}
                    style={{ flexGrow: 1, minWidth: 120, minHeight: 38 }}
                  />
                  <Button
                    label="Delete"
                    tone="danger"
                    onPress={async () => {
                      await deleteStoredFile(file.uri);
                      await refresh();
                    }}
                    style={{ flexGrow: 1, minWidth: 70, minHeight: 38 }}
                  />
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
