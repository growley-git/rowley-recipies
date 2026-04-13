import path from "node:path";

/** Directory containing `*.md` recipe entries (flat file root). */
export function getContentRecipesDir(): string {
  const raw = process.env.CONTENT_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }
  // Repo default: ../../content/recipes from apps/api when cwd is apps/api
  return path.resolve(process.cwd(), "../../content/recipes");
}

/** `db` (default): recipes from Prisma. `files`: recipes read from CONTENT_DIR only. */
export function getRecipeSource(): "db" | "files" {
  const v = (process.env.RECIPE_SOURCE ?? "db").toLowerCase();
  return v === "files" ? "files" : "db";
}

/** Dev: set to `1` to re-read recipe files on every request (file provider). */
export function contentHotReload(): boolean {
  return process.env.CONTENT_HOT_RELOAD === "1";
}
