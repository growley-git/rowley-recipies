import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ContentParseError } from "./errors.js";
import { parseRecipeFileSource, stepsFromMarkdownBody } from "./parse.js";

const here = path.dirname(fileURLToPath(import.meta.url));

describe("stepsFromMarkdownBody", () => {
  it("parses ## sections", () => {
    const steps = stepsFromMarkdownBody("## A\n\nDo a.\n\n## B\n\nDo b.");
    expect(steps).toEqual(["A\n\nDo a.", "B\n\nDo b."]);
  });

  it("parses bullets when no headings", () => {
    expect(stepsFromMarkdownBody("- one\n- two")).toEqual(["one", "two"]);
  });
});

describe("parseRecipeFileSource", () => {
  it("parses fixture minimal.md", async () => {
    const raw = await readFile(
      path.join(here, "__fixtures__", "minimal.md"),
      "utf8"
    );
    const p = parseRecipeFileSource(raw, "minimal.md");
    expect(p.frontmatter.title).toBe("Minimal test");
    expect(p.frontmatter.slug).toBe("minimal-test");
    expect(p.steps.length).toBe(1);
    expect(p.steps[0]).toContain("Boil");
  });

  it("throws when no direction steps", async () => {
    const raw = await readFile(
      path.join(here, "__fixtures__", "invalid-no-steps.md"),
      "utf8"
    );
    expect(() => parseRecipeFileSource(raw, "bad.md")).toThrow(
      ContentParseError
    );
  });
});
