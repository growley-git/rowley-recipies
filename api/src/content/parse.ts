import fs from "node:fs/promises";
import YAML from "yaml";
import { ContentParseError } from "./errors.js";
import type { RecipeFrontmatterRaw } from "./schema.js";
import { validateFrontmatter } from "./schema.js";

export type ParsedRecipeFile = {
  filePath: string;
  frontmatter: import("./schema.js").ValidatedRecipeFrontmatter;
  steps: string[];
};

function splitFrontmatter(
  raw: string,
  filePath: string
): { yaml: string; body: string } {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new ContentParseError(
      "File must start with YAML frontmatter delimited by ---",
      filePath
    );
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    throw new ContentParseError("Unclosed frontmatter (missing closing ---)", filePath);
  }
  const yaml = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n").replace(/^\n+/, "");
  return { yaml, body };
}

/** Derive direction steps from Markdown body (## sections or bullet list). */
export function stepsFromMarkdownBody(body: string): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  if (/^##\s+/m.test(trimmed)) {
    const parts = trimmed.split(/^##\s+/m).filter((p) => p.trim().length > 0);
    return parts
      .map((part) => {
        const lines = part.trim().split("\n");
        const title = (lines[0] ?? "").trim();
        const rest = lines.slice(1).join("\n").trim();
        if (!title) return rest;
        return rest ? `${title}\n\n${rest}` : title;
      })
      .filter((s) => s.length > 0);
  }

  const bulletLines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "));
  if (bulletLines.length > 0) {
    return bulletLines
      .map((l) => l.replace(/^-\s+/, "").trim())
      .filter(Boolean);
  }

  return [trimmed];
}

export function parseRecipeFileSource(
  raw: string,
  filePath: string
): ParsedRecipeFile {
  const { yaml, body } = splitFrontmatter(raw, filePath);
  let data: unknown;
  try {
    data = YAML.parse(yaml);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ContentParseError(`Invalid YAML: ${msg}`, filePath);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ContentParseError("Frontmatter must be a YAML mapping", filePath);
  }
  const validated = validateFrontmatter(
    data as RecipeFrontmatterRaw,
    filePath
  );
  if (validated instanceof ContentParseError) {
    throw validated;
  }
  const steps = stepsFromMarkdownBody(body);
  if (steps.length === 0) {
    throw new ContentParseError(
      "Recipe body must contain at least one direction step (## headings or - bullets)",
      filePath
    );
  }
  return {
    filePath,
    frontmatter: validated,
    steps,
  };
}

export async function parseRecipeFile(
  filePath: string
): Promise<ParsedRecipeFile> {
  const raw = await fs.readFile(filePath, "utf8");
  return parseRecipeFileSource(raw, filePath);
}
