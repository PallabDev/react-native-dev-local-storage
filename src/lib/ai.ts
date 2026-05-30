import type { Snippet } from "@/types/snippet";

type OpenAIResponse = {
  output_text?: string;
  output?: {
    content?: {
      text?: string;
      type?: string;
    }[];
  }[];
  error?: { message?: string };
};

export async function explainSnippet(snippet: Snippet, apiKey: string, model: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Explain code snippets for developers. Return concise sections: Summary, How it works, Suggestions.",
        },
        {
          role: "user",
          content: `Language: ${snippet.language}
Title: ${snippet.title}
Tags: ${snippet.tags.join(", ")}

Code:
\`\`\`${snippet.language}
${snippet.code}
\`\`\``,
        },
      ],
    }),
  });

  const json = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(json.error?.message ?? "AI request failed");
  }

  const text =
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n");

  return text?.trim() || "No explanation was returned.";
}
