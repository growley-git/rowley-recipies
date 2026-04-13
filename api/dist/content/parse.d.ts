export type ParsedRecipeFile = {
    filePath: string;
    frontmatter: import("./schema.js").ValidatedRecipeFrontmatter;
    steps: string[];
};
/** Derive direction steps from Markdown body (## sections or bullet list). */
export declare function stepsFromMarkdownBody(body: string): string[];
export declare function parseRecipeFileSource(raw: string, filePath: string): ParsedRecipeFile;
export declare function parseRecipeFile(filePath: string): Promise<ParsedRecipeFile>;
//# sourceMappingURL=parse.d.ts.map