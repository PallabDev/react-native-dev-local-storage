import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import { SnippetForm } from "@/components/snippets/snippet-form";
import { useTheme } from "@/components/ui";
import { createSnippet, getSnippet, updateSnippet } from "@/lib/snippet-store";
import type { Snippet, SnippetInput } from "@/types/snippet";

export default function CreateSnippetScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    async function loadSnippet() {
      if (!id) {
        return;
      }

      setSnippet(await getSnippet(db, Number(id)));
    }

    void loadSnippet();
  }, [db, id]);

  async function submit(input: SnippetInput) {
    if (id) {
      await updateSnippet(db, Number(id), input);
      router.replace({ pathname: "/snippet/[id]", params: { id } });
      return;
    }

    const newId = await createSnippet(db, input);
    router.replace({ pathname: "/snippet/[id]", params: { id: String(newId) } });
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 18 }}
      style={{ backgroundColor: colors.paper }}
    >
      <SnippetForm snippet={snippet} onSubmit={submit} />
    </ScrollView>
  );
}

