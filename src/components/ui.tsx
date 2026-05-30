import React, { createContext, useContext, useState, useEffect } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle, useColorScheme } from "react-native";
import { getThemePreference } from "@/lib/preferences";
import type { ThemePreference } from "@/types/snippet";

// Standard static colors for backward compatibility
export const colors = {
  ink: "#17211b",
  muted: "#68736c",
  paper: "#fbfcf7",
  panel: "#ffffff",
  line: "#dfe6da",
  accent: "#216e54",
  accentSoft: "#dcefe7",
  warn: "#b0442e",
  gold: "#9a6a05",
  blue: "#295b8f",
};

// Premium Theme Colors
export const lightColors = {
  ink: "#0f172a",       // Deep Slate-900
  muted: "#64748b",     // Slate-500
  paper: "#f8fafc",     // Slate-50
  panel: "#ffffff",     // Pure White
  line: "#e2e8f0",      // Slate-200
  accent: "#0d9488",    // Teal-600 (Vibrant Forest Accent)
  accentSoft: "#f0fdfa",// Teal-50
  warn: "#ef4444",      // Red-500
  gold: "#f59e0b",      // Amber-500
  blue: "#3b82f6",      // Blue-500
  codeBg: "#0f172a",    // Dark Slate Code Editor
  codeText: "#f8fafc",
};

export const darkColors = {
  ink: "#f8fafc",       // Slate-50
  muted: "#94a3b8",     // Slate-400
  paper: "#090d16",     // Cyber-Black Obsidian
  panel: "#111827",     // Deep Cyber-Ink Slate-900
  line: "#1e293b",      // Slate-800
  accent: "#14b8a6",    // Neon Teal-400
  accentSoft: "#134e4a",// Deep Teal-900
  warn: "#f87171",      // Red-400
  gold: "#fbbf24",      // Amber-400
  blue: "#60a5fa",      // Blue-400
  codeBg: "#05070c",    // Midnight Dark Code Box
  codeText: "#38bdf8",  // Cyber Sky Blue text
};

export type ThemeColors = typeof darkColors;

type ThemeContextType = {
  theme: "light" | "dark";
  themePreference: ThemePreference;
  colors: ThemeColors;
  setThemePreferenceState: (pref: ThemePreference) => void;
  refreshTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

  const refreshTheme = async () => {
    const pref = await getThemePreference();
    setPreference(pref);
    if (pref === "system") {
      setResolvedTheme(systemScheme === "light" ? "light" : "dark");
    } else {
      setResolvedTheme(pref);
    }
  };

  useEffect(() => {
    void refreshTheme();
  }, [systemScheme]);

  const activeColors = resolvedTheme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themePreference: preference,
        colors: activeColors,
        setThemePreferenceState: setPreference,
        refreshTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as const,
      themePreference: "system" as const,
      colors: darkColors,
      setThemePreferenceState: () => {},
      refreshTheme: async () => {},
    };
  }
  return ctx;
}

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: "primary" | "secondary" | "danger" | "plain";
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const { colors, theme } = useTheme();

  const background =
    tone === "primary"
      ? colors.accent
      : tone === "danger"
      ? colors.warn
      : tone === "plain"
      ? "transparent"
      : colors.accentSoft;

  const foreground =
    tone === "primary"
      ? "#ffffff"
      : tone === "danger"
      ? "#ffffff"
      : tone === "plain"
      ? colors.ink
      : theme === "dark"
      ? "#2dd4bf"
      : colors.accent;

  const borderStyle: ViewStyle =
    tone === "plain"
      ? {
          borderWidth: 1,
          borderColor: colors.line,
        }
      : {};

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        shadowColor: tone === "primary" ? colors.accent : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: tone === "primary" && theme === "dark" ? 0.25 : 0.05,
        shadowRadius: 4,
        elevation: tone === "primary" ? 2 : 0,
        transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        ...borderStyle,
        ...style,
      })}
    >
      <Text style={{ color: foreground, fontWeight: "700", letterSpacing: 0.1, fontSize: 14 }} selectable>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700", letterSpacing: 0.2 }} selectable>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme === "dark" ? "#4b5563" : "#94a3b8"}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
        style={[
          {
            minHeight: props.multiline ? 140 : 48,
            borderWidth: 1.5,
            borderColor: isFocused ? colors.accent : colors.line,
            backgroundColor: colors.panel,
            borderRadius: 12,
            borderCurve: "continuous",
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.ink,
            fontSize: 15,
            textAlignVertical: props.multiline ? "top" : "center",
            fontFamily: props.multiline ? "monospace" : undefined,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isFocused ? 0.08 : 0.02,
            shadowRadius: 3,
            elevation: isFocused ? 1 : 0,
          },
          props.style,
        ]}
      />
    </View>
  );
}

// Brand-styled language colors helper for super premium look
export function getLanguageColor(language: string, isDark: boolean) {
  const lang = language.toLowerCase().trim();
  if (lang.includes("typescript") || lang === "ts") return { bg: isDark ? "#1e293b" : "#eff6ff", text: "#3b82f6" };
  if (lang.includes("javascript") || lang === "js") return { bg: isDark ? "#2d2d14" : "#fef9c3", text: isDark ? "#facc15" : "#a16207" };
  if (lang.includes("python") || lang === "py") return { bg: isDark ? "#1e293b" : "#f0fdf4", text: "#10b981" };
  if (lang.includes("swift")) return { bg: isDark ? "#2d1e18" : "#fff7ed", text: "#f97316" };
  if (lang.includes("kotlin") || lang === "kt") return { bg: isDark ? "#291b35" : "#faf5ff", text: "#a855f7" };
  if (lang.includes("json")) return { bg: isDark ? "#1e293b" : "#f0fdfa", text: "#0d9488" };
  if (lang.includes("html") || lang.includes("css")) return { bg: isDark ? "#2d1a24" : "#fff1f2", text: "#f43f5e" };
  // Default Accent
  return { bg: isDark ? "#112a24" : "#f0fdfa", text: isDark ? "#14b8a6" : "#0d9488" };
}

export function Pill({ label, active = false, language }: { label: string; active?: boolean; language?: string }) {
  const { colors, theme } = useTheme();

  // If a language is provided, style it beautifully using brand colors
  const brandColors = language ? getLanguageColor(language, theme === "dark") : null;

  const bg = active
    ? colors.accent
    : brandColors
    ? brandColors.bg
    : colors.accentSoft;

  const text = active
    ? "#ffffff"
    : brandColors
    ? brandColors.text
    : theme === "dark"
    ? "#2dd4bf"
    : colors.accent;

  return (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: active ? 0 : 1,
        borderColor: brandColors ? "transparent" : colors.line,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: text, fontSize: 12, fontWeight: "700", letterSpacing: 0.2 }} selectable>
        {label}
      </Text>
    </View>
  );
}

export const panelStyle = {
  gap: 12,
  padding: 16,
  borderWidth: 1.5,
  borderColor: "#dfe6da", // Will be overridden dynamically in components
  borderRadius: 12,
  borderCurve: "continuous" as const,
  backgroundColor: "#ffffff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 1,
};

export const codeStyle = {
  color: "#38bdf8",
  backgroundColor: "#05070c",
  borderRadius: 12,
  borderCurve: "continuous" as const,
  padding: 14,
  lineHeight: 22,
  fontFamily: "monospace",
  fontSize: 14,
  borderWidth: 1,
  borderColor: "#1e293b",
};

