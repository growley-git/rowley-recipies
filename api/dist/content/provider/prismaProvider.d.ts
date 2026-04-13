import type { PrismaClient } from "@prisma/client";
import type { RecipeContentProvider, RecipeFilter, RecipeGraphQLNode } from "./types.js";
export declare class PrismaRecipeContentProvider implements RecipeContentProvider {
    private readonly prisma;
    readonly source: "db";
    constructor(prisma: PrismaClient);
    supportsRecipeMutations(): boolean;
    findFirst(args: {
        id?: string;
        slug?: string | undefined;
    }): Promise<RecipeGraphQLNode | null>;
    findRecipesConnection(args: {
        filter: RecipeFilter;
        first: number;
        after: string | null | undefined;
    }): Promise<{
        edges: {
            cursor: string;
            node: RecipeGraphQLNode;
        }[];
        pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
        };
        totalCount: number;
    }>;
    listTags(): Promise<{
        name: string;
        id: string;
        slug: string;
    }[]>;
    findRecipeMetaByIds(ids: string[]): Promise<{
        id: string;
        title: string;
        slug: string;
    }[]>;
    findForGrocery(recipeId: string): Promise<{
        id: string;
        publishedAt: Date | null;
        ingredients: {
            foodName: string;
            unit: string;
            amount: number;
            note: string | null;
        }[];
    } | null>;
    findTitle(recipeId: string): Promise<{
        title: string;
    } | null>;
    findForSummarize(recipeId: string): Promise<{
        aiSummary: string | null;
        steps: {
            text: string;
        }[];
    } | null>;
}
//# sourceMappingURL=prismaProvider.d.ts.map