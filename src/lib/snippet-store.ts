import type { SQLiteDatabase } from "expo-sqlite";

import type { Snippet, SnippetInput } from "@/types/snippet";

type SnippetRow = {
  id: number;
  title: string;
  code: string;
  language: string;
  tags_json: string;
  is_favorite: number;
  ai_response: string | null;
  attachments_json: string;
  created_at: number;
  updated_at: number;
};

function parseJsonList(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function mapSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    title: row.title,
    code: row.code,
    language: row.language,
    tags: parseJsonList(row.tags_json),
    isFavorite: row.is_favorite === 1,
    aiResponse: row.ai_response,
    attachments: parseJsonList(row.attachments_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSnippets(db: SQLiteDatabase, query = "", favoritesOnly = false) {
  const needle = `%${query.trim().toLowerCase()}%`;
  const rows = await db.getAllAsync<SnippetRow>(
    `
      SELECT * FROM snippets
      WHERE ($query = '' OR lower(title) LIKE $needle OR lower(code) LIKE $needle OR lower(language) LIKE $needle OR lower(tags_json) LIKE $needle)
        AND ($favoritesOnly = 0 OR is_favorite = 1)
      ORDER BY is_favorite DESC, updated_at DESC
    `,
    { $query: query.trim(), $needle: needle, $favoritesOnly: favoritesOnly ? 1 : 0 },
  );

  return rows.map(mapSnippet);
}

export async function getSnippet(db: SQLiteDatabase, id: number) {
  const row = await db.getFirstAsync<SnippetRow>("SELECT * FROM snippets WHERE id = ?", id);
  return row ? mapSnippet(row) : null;
}

export async function createSnippet(db: SQLiteDatabase, input: SnippetInput) {
  const now = Date.now();
  const result = await db.runAsync(
    `
      INSERT INTO snippets (title, code, language, tags_json, created_at, updated_at)
      VALUES ($title, $code, $language, $tags, $createdAt, $updatedAt)
    `,
    {
      $title: input.title.trim(),
      $code: input.code,
      $language: input.language.trim() || "text",
      $tags: JSON.stringify(input.tags),
      $createdAt: now,
      $updatedAt: now,
    },
  );

  return result.lastInsertRowId;
}

export async function updateSnippet(db: SQLiteDatabase, id: number, input: SnippetInput) {
  await db.runAsync(
    `
      UPDATE snippets
      SET title = $title, code = $code, language = $language, tags_json = $tags, updated_at = $updatedAt
      WHERE id = $id
    `,
    {
      $id: id,
      $title: input.title.trim(),
      $code: input.code,
      $language: input.language.trim() || "text",
      $tags: JSON.stringify(input.tags),
      $updatedAt: Date.now(),
    },
  );
}

export async function deleteSnippet(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM snippets WHERE id = ?", id);
}

export async function toggleFavorite(db: SQLiteDatabase, snippet: Snippet) {
  await db.runAsync(
    "UPDATE snippets SET is_favorite = ?, updated_at = ? WHERE id = ?",
    snippet.isFavorite ? 0 : 1,
    Date.now(),
    snippet.id,
  );
}

export async function saveAiResponse(db: SQLiteDatabase, id: number, response: string) {
  await db.runAsync(
    "UPDATE snippets SET ai_response = ?, updated_at = ? WHERE id = ?",
    response,
    Date.now(),
    id,
  );
}

export async function addAttachment(db: SQLiteDatabase, snippet: Snippet, uri: string) {
  const attachments = Array.from(new Set([...snippet.attachments, uri]));
  await db.runAsync(
    "UPDATE snippets SET attachments_json = ?, updated_at = ? WHERE id = ?",
    JSON.stringify(attachments),
    Date.now(),
    snippet.id,
  );
}
