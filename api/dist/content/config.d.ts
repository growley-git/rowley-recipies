/** Directory containing `*.md` recipe entries (flat file root). */
export declare function getContentRecipesDir(): string;
/** `db` (default): recipes from Prisma. `files`: recipes read from CONTENT_DIR only. */
export declare function getRecipeSource(): "db" | "files";
/** Dev: set to `1` to re-read recipe files on every request (file provider). */
export declare function contentHotReload(): boolean;
//# sourceMappingURL=config.d.ts.map