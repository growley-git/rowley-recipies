import type { PrismaClient } from "@prisma/client";
export type ImportResult = {
    imported: number;
    warnings: string[];
};
/**
 * Upsert recipes from Markdown files into Prisma (flat-file → DB sync).
 * Idempotent on `slug`. Preserves existing `id` when updating by slug so grocery links stay valid.
 */
export declare function runContentImport(prisma: PrismaClient, options?: {
    dir?: string;
    verbose?: boolean;
}): Promise<ImportResult>;
//# sourceMappingURL=import.d.ts.map