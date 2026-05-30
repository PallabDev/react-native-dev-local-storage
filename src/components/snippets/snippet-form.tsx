import { useEffect, useState } from "react";
import { Alert, View } from "react-native";

import { Button, Field } from "@/components/ui";
import type { Snippet, SnippetInput } from "@/types/snippet";

const emptyForm: SnippetInput = {
  title: "",
  code: "",
  language: "typescript",
  tags: [],
};

function tagStringToList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function SnippetForm({
  snippet,
  onSubmit,
}: {
  snippet?: Snippet | null;
  onSubmit: (input: SnippetInput) => Promise<void>;
}) {
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!snippet) {
      return;
    }

    setForm({
      title: snippet.title,
      code: snippet.code,
      language: snippet.language,
      tags: snippet.tags,
    });
    setTagInput(snippet.tags.join(", "));
  }, [snippet]);

  async function save() {
    if (!form.title.trim() || !form.code.trim()) {
      Alert.alert("Missing details", "Add a title and code before saving.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ ...form, tags: tagStringToList(tagInput) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      <Field
        label="Title"
        value={form.title}
        onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        placeholder="JWT decode helper"
      />
      <Field
        label="Language"
        value={form.language}
        onChangeText={(language) => setForm((current) => ({ ...current, language }))}
        placeholder="typescript"
      />
      <Field label="Tags" value={tagInput} onChangeText={setTagInput} placeholder="auth, utils, frontend" />
      <Field
        label="Code"
        value={form.code}
        onChangeText={(code) => setForm((current) => ({ ...current, code }))}
        multiline
        placeholder="Paste reusable code here"
      />
      <Button label={snippet ? "Save Changes" : "Create Snippet"} onPress={save} disabled={saving} />
    </View>
  );
}
