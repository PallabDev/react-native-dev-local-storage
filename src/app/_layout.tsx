import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider, useTheme } from "@/components/ui";

async function migrateDatabase(db: SQLiteDatabase) {
  const { user_version: currentVersion } =
    (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version")) ?? {
      user_version: 0,
    };

  if (currentVersion >= 1) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      ai_response TEXT,
      attachments_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS snippets_title_idx ON snippets(title);
    CREATE INDEX IF NOT EXISTS snippets_language_idx ON snippets(language);
    PRAGMA user_version = 1;
  `);
}


function AppNavigator() {
  const { colors, theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.paper,
        },
        headerTitleStyle: {
          color: colors.ink,
          fontWeight: "900",
        },
        headerLargeTitleStyle: {
          color: colors.ink,
          fontWeight: "900",
        },
        headerTintColor: theme === "dark" ? "#2dd4bf" : colors.accent,
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="index" options={{ title: "DevSnippets" }} />
      <Stack.Screen name="create-snippet" options={{ title: "Create Snippet" }} />
      <Stack.Screen name="snippet/[id]" options={{ title: "Snippet Details" }} />
      <Stack.Screen name="favorites" options={{ title: "Favorites" }} />
      <Stack.Screen name="files" options={{ title: "File Manager" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#090d16" }}>
          <ActivityIndicator color="#14b8a6" />
        </View>
      }
    >
      <ThemeProvider>
        <SQLiteProvider
          databaseName="devsnippets.db"
          onInit={migrateDatabase}
          useSuspense
        >
          <AppNavigator />
        </SQLiteProvider>
      </ThemeProvider>
    </Suspense>
  );
}

