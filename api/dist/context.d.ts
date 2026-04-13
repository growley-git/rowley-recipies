import type { PrismaClient } from "@prisma/client";
import type { RecipeContentProvider } from "./content/provider/types.js";
export interface GraphQLContext {
    prisma: PrismaClient;
    recipeContent: RecipeContentProvider;
    authHeader: string | undefined;
    sessionKey: string;
}
export declare function createContext(params: {
    prisma: PrismaClient;
    recipeContent: RecipeContentProvider;
    authHeader: string | undefined;
    sessionKey: string;
}): GraphQLContext;
//# sourceMappingURL=context.d.ts.map