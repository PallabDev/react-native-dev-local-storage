import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/snippets/empty-state";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { Button, Field, useTheme, panelStyle } from "@/components/ui";
import { listSnippets, toggleFavorite } from "@/lib/snippet-store";
import type { Snippet } from "@/types/snippet";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { colors, theme, refreshTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  const refresh = useCallback(async () => {
    await AsyncStorage.setItem("devsnippets.lastOpened", String(Date.now()));
    setSnippets(await listSnippets(db, query));
  }, [db, query]);

  useFocusEffect(
    useCallback(() => {
      void refreshTheme();
      void refresh();
    }, [refreshTheme, refresh]),
  );

  const favoriteCount = snippets.filter((snippet) => snippet.isFavorite).length;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 18 }}
      style={{ backgroundColor: colors.paper }}
    >
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }} selectable>
          Offline-First Snippet Vault
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Link href="/create-snippet" asChild>
            <Button label="New Snippet" style={{ flexGrow: 1, minWidth: 120 }} />
          </Link>
          <Link href="/favorites" asChild>
            <Button label="Favorites" tone="secondary" style={{ flexGrow: 1, minWidth: 100 }} />
          </Link>
          <Link href="/files" asChild>
            <Button label="File Manager" tone="secondary" style={{ flexGrow: 1, minWidth: 120 }} />
          </Link>
          <Link href="/settings" asChild>
            <Button label="Settings" tone="plain" style={{ flexGrow: 1, minWidth: 90 }} />
          </Link>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[panelStyle, { flex: 1, backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={{ color: colors.ink, fontSize: 28, fontWeight: "900", fontVariant: ["tabular-nums"] }} selectable>
            {snippets.length}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 }} selectable>
            Snippets
          </Text>
        </View>
        <View style={[panelStyle, { flex: 1, backgroundColor: colors.panel, borderColor: colors.line }]}>
          <Text style={{ color: colors.gold, fontSize: 28, fontWeight: "900", fontVariant: ["tabular-nums"] }} selectable>
            {favoriteCount}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 }} selectable>
            Favorites
          </Text>
        </View>
      </View>

      <Field
        label="Search Snippets"
        value={query}
        onChangeText={setQuery}
        placeholder="Search title, code, language, or tags..."
      />

      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: 0.2 }} selectable>
          Recent Snippets
        </Text>
        {snippets.length === 0 ? (
          <EmptyState text="No snippets yet. Create one and it will be stored locally for offline use." />
        ) : (
          snippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onFavorite={async () => {
                await toggleFavorite(db, snippet);
                await refresh();
              }}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
