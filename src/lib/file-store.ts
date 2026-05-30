import * as FileSystem from "expo-file-system/legacy";

import type { Snippet, StoredFile } from "@/types/snippet";

export const appDirectory = `${FileSystem.documentDirectory ?? ""}devsnippets/`;

const folderNames = ["Screenshots", "Exports", "Templates", "Resources"] as const;

async function ensureDirectory(uri: string) {
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true }).catch(() => {});
}

export async function ensureWorkspace() {
  await ensureDirectory(appDirectory);
  await Promise.all(folderNames.map((name) => ensureDirectory(`${appDirectory}${name}/`)));
}

export async function listStoredFiles(folder = ""): Promise<StoredFile[]> {
  await ensureWorkspace();
  const directory = folder ? `${appDirectory}${folder}/` : appDirectory;
  await ensureDirectory(directory);
  const names = await FileSystem.readDirectoryAsync(directory);

  return Promise.all(
    names.map(async (name) => {
      const uri = `${directory}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      return {
        name,
        uri,
        folder,
        size: info.exists && "size" in info ? info.size ?? 0 : 0,
        kind: info.exists && info.isDirectory ? "directory" : "file",
      };
    }),
  );
}

export async function writeTextFile(folder: string, name: string, content: string, mimeType = "text/plain") {
  await ensureWorkspace();
  const directory = `${appDirectory}${folder}/`;
  await ensureDirectory(directory);
  const uri = `${directory}${safeFileName(name)}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  return { uri, mimeType };
}

export async function deleteStoredFile(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

export async function copyStoredFile(uri: string, destinationFolder: string) {
  await ensureWorkspace();
  const destination = `${appDirectory}${destinationFolder}/${fileNameFromUri(uri)}`;
  await deleteStoredFile(destination);
  await FileSystem.copyAsync({ from: uri, to: destination });
}

export async function moveStoredFile(uri: string, destinationFolder: string) {
  await ensureWorkspace();
  const destination = `${appDirectory}${destinationFolder}/${fileNameFromUri(uri)}`;
  await deleteStoredFile(destination);
  await FileSystem.moveAsync({ from: uri, to: destination });
}

export async function createStarterTemplates() {
  await writeTextFile(
    "Templates",
    "react-hook-template.tsx",
    `import { useMemo } from "react";

export function useFilteredItems<T>(items: T[], query: string, selector: (item: T) => string) {
  return useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => selector(item).toLowerCase().includes(needle));
  }, [items, query, selector]);
}
`,
    "text/typescript",
  );
  await writeTextFile(
    "Resources",
    "api-error-helper.ts",
    `export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
`,
    "text/typescript",
  );
}

export function buildSnippetExport(snippet: Snippet, format: "txt" | "js" | "json") {
  if (format === "json") {
    return {
      name: `${safeFileName(snippet.title)}.json`,
      content: JSON.stringify(snippet, null, 2),
      mimeType: "application/json",
    };
  }

  if (format === "js") {
    return {
      name: `${safeFileName(snippet.title)}.js`,
      content: snippet.code,
      mimeType: "application/javascript",
    };
  }

  return {
    name: `${safeFileName(snippet.title)}.txt`,
    content: `${snippet.title}\nLanguage: ${snippet.language}\nTags: ${snippet.tags.join(", ")}\n\n${snippet.code}`,
    mimeType: "text/plain",
  };
}

export function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-|-$/g, "");
  return cleaned || `snippet-${Date.now()}`;
}

function fileNameFromUri(uri: string) {
  return uri.split("/").filter(Boolean).pop() ?? `file-${Date.now()}`;
}
