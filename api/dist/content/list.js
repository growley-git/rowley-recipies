import fs from "node:fs/promises";
import path from "node:path";
import { getContentRecipesDir } from "./config.js";
/** Absolute paths to `*.md` recipe files (non-recursive). */
export async function listRecipeMarkdownFiles(dir = getContentRecipesDir()) {
    let names;
    try {
        names = await fs.readdir(dir);
    }
    catch (e) {
        const code = e.code;
        if (code === "ENOENT") {
            return [];
        }
        throw e;
    }
    return names
        .filter((n) => n.endsWith(".md") && !n.startsWith("."))
        .map((n) => path.join(dir, n))
        .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}
//# sourceMappingURL=list.js.map