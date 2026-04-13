import { ContentParseError } from "./errors.js";
export type RecipeIngredientYaml = {
    foodName: string;
    unit: string;
    amount: number;
    section?: string | null;
    note?: string | null;
};
/** Raw frontmatter before normalization (YAML). */
export type RecipeFrontmatterRaw = {
    id?: string;
    title?: string;
    slug?: string;
    published?: boolean;
    publishedAt?: string;
    tags?: string[];
    ingredients?: unknown[];
    summary?: string | null;
};
export type ValidatedRecipeFrontmatter = {
    id?: string;
    title: string;
    slug: string;
    publishedAt: Date | null;
    tags: string[];
    ingredients: RecipeIngredientYaml[];
    summary: string | null;
};
export declare function validateFrontmatter(raw: RecipeFrontmatterRaw, filePath?: string): ValidatedRecipeFrontmatter | ContentParseError;
//# sourceMappingURL=schema.d.ts.map