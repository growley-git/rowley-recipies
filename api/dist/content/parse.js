import fs from "node:fs/promises";
import YAML from "yaml";
import { ContentParseError } from "./errors.js";
import { validateFrontmatter } from "./schema.js";
function splitFrontmatter(raw, filePath) {
    const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
    if (lines[0]?.trim() !== "---") {
        throw new ContentParseError("File must start with YAML frontmatter delimited by ---", filePath);
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
export function stepsFromMarkdownBody(body) {
    const trimmed = body.trim();
    if (!trimmed)
        return [];
    if (/^##\s+/m.test(trimmed)) {
        const parts = trimmed.split(/^##\s+/m).filter((p) => p.trim().length > 0);
        return parts
            .map((part) => {
            const lines = part.trim().split("\n");
            const title = (lines[0] ?? "").trim();
            const rest = lines.slice(1).join("\n").trim();
            if (!title)
                return rest;
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
export function parseRecipeFileSource(raw, filePath) {
    const { yaml, body } = splitFrontmatter(raw, filePath);
    let data;
    try {
        data = YAML.parse(yaml);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new ContentParseError(`Invalid YAML: ${msg}`, filePath);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new ContentParseError("Frontmatter must be a YAML mapping", filePath);
    }
    const validated = validateFrontmatter(data, filePath);
    if (validated instanceof ContentParseError) {
        throw validated;
    }
    const steps = stepsFromMarkdownBody(body);
    if (steps.length === 0) {
        throw new ContentParseError("Recipe body must contain at least one direction step (## headings or - bullets)", filePath);
    }
    return {
        filePath,
        frontmatter: validated,
        steps,
    };
}
export async function parseRecipeFile(filePath) {
    const raw = await fs.readFile(filePath, "utf8");
    return parseRecipeFileSource(raw, filePath);
}
//# sourceMappingURL=parse.js.map