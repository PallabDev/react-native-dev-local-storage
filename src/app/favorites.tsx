import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/snippets/empty-state";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { Field, useTheme } from "@/components/ui";
import { listSnippets, toggleFavorite } from "@/lib/snippet-store";
import type { Snippet } from "@/types/snippet";

export default function FavoritesScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  const refresh = useCallback(async () => {
    setSnippets(await listSnippets(db, query, true));
  }, [db, query]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 18 }}
      style={{ backgroundColor: colors.paper }}
    >
      <Field
        label="Search Favorites"
        value={query}
        onChangeText={setQuery}
        placeholder="Search starred snippets..."
      />
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: 0.2 }} selectable>
          Favorite Snippets
        </Text>
        {snippets.length === 0 ? (
          <EmptyState text="No favorites yet. Mark a snippet as favorite and it will appear here offline." />
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

