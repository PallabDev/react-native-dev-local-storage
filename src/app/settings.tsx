import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button, Field, panelStyle, Pill, useTheme } from "@/components/ui";
import {
  getAiModel,
  getApiKey,
  getThemePreference,
  setAiModel,
  setApiKey,
  setThemePreference,
} from "@/lib/preferences";
import type { ThemePreference } from "@/types/snippet";

export default function SettingsScreen() {
  const { colors, theme, refreshTheme } = useTheme();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [model, setModel] = useState("gpt-5-mini");
  const [activeTheme, setActiveTheme] = useState<ThemePreference>("system");

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        setActiveTheme(await getThemePreference());
        setModel(await getAiModel());
        setApiKeyInput((await getApiKey()) ? "Saved securely" : "");
      }

      void loadSettings();
    }, []),
  );

  async function saveSettings() {
    if (apiKeyInput !== "Saved securely") {
      await setApiKey(apiKeyInput);
    }
    await setAiModel(model);
    await setThemePreference(activeTheme);
    await refreshTheme(); // Immediately refresh the theme state across the entire app
    setApiKeyInput((await getApiKey()) ? "Saved securely" : "");
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 16 }}
      style={{ backgroundColor: colors.paper }}
    >
      <View style={[panelStyle, { backgroundColor: colors.panel, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900", letterSpacing: 0.1 }} selectable>
          Preferences
        </Text>

        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.2 }}>
            Theme Preference
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["system", "light", "dark"] as ThemePreference[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setActiveTheme(item)}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Pill label={item === "system" ? "System Default" : item === "light" ? "Light Mode" : "Dark Mode"} active={activeTheme === item} />
              </Pressable>
            ))}
          </View>
        </View>

        <Field
          label="AI Model"
          value={model}
          onChangeText={setModel}
          placeholder="gpt-5-mini"
          style={{ marginTop: 4 }}
        />
        <Field
          label="OpenAI API Key"
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="sk-..."
          secureTextEntry={apiKeyInput !== "Saved securely"}
        />

        <View style={{ marginTop: 6 }}>
          <Button label="Save Settings" onPress={saveSettings} />
        </View>
      </View>

      <View
        style={[
          panelStyle,
          {
            backgroundColor: theme === "dark" ? "#0f1524" : "#f8fafc",
            borderColor: colors.line,
          },
        ]}
      >
        <Text
          style={{
            color: theme === "dark" ? "#2dd4bf" : colors.accent,
            fontSize: 14,
            fontWeight: "900",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
          selectable
        >
          Local-First Storage Map
        </Text>
        <Text style={{ color: colors.ink, lineHeight: 22, fontSize: 13, fontWeight: "500" }} selectable>
          SQLite stores snippets and AI responses locally on device. AsyncStorage stores theme and app preferences. SecureStore stores your OpenAI API key in the keychain, with an AsyncStorage fallback for web. Expo FileSystem stores code exports, starter templates, screenshots, and imported resources.
        </Text>
      </View>
    </ScrollView>
  );
}

