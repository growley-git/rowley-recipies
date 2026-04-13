import type { RecipeContentProvider, RecipeFilter, RecipeGraphQLNode } from "./types.js";
export declare class FileRecipeContentProvider implements RecipeContentProvider {
    private readonly recipesDir;
    readonly source: "files";
    private cache;
    constructor(recipesDir?: string);
    supportsRecipeMutations(): boolean;
    private loadAll;
    findFirst(args: {
        id?: string;
        slug?: string;
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
        id: string;
        name: string;
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
//# sourceMappingURL=fileProvider.d.ts.map