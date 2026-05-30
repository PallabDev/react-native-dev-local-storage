import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Pill, useTheme, panelStyle } from "@/components/ui";
import type { Snippet } from "@/types/snippet";

export function SnippetCard({
  snippet,
  onFavorite,
}: {
  snippet: Snippet;
  onFavorite: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Link href={{ pathname: "/snippet/[id]", params: { id: String(snippet.id) } }} asChild>
      <Pressable
        style={({ pressed }) => [
          panelStyle,
          {
            backgroundColor: colors.panel,
            borderColor: colors.line,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "800", letterSpacing: 0.1 }} selectable>
              {snippet.title}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                color: colors.muted,
                fontSize: 13,
                fontFamily: "monospace",
                lineHeight: 18,
                marginTop: 2,
              }}
              selectable
            >
              {snippet.code}
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.preventDefault();
              onFavorite();
            }}
            style={({ pressed }) => ({
              padding: 6,
              transform: [{ scale: pressed ? 0.85 : 1 }],
            })}
          >
            <Text
              style={{
                color: snippet.isFavorite ? colors.gold : colors.muted,
                fontSize: 22,
                fontWeight: "900",
                lineHeight: 22,
              }}
              selectable
            >
              {snippet.isFavorite ? "★" : "☆"}
            </Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          <Pill label={snippet.language} language={snippet.language} />
          {snippet.tags.slice(0, 4).map((tag) => (
            <Pill key={tag} label={tag} />
          ))}
        </View>
      </Pressable>
    </Link>
  );
}

