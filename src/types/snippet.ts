export type Snippet = {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string[];
  isFavorite: boolean;
  aiResponse: string | null;
  attachments: string[];
  createdAt: number;
  updatedAt: number;
};

export type SnippetInput = {
  title: string;
  code: string;
  language: string;
  tags: string[];
};

export type StoredFile = {
  name: string;
  uri: string;
  folder: string;
  size: number;
  kind: "file" | "directory";
};

export type ThemePreference = "system" | "light" | "dark";
