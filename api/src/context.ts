import type { PrismaClient } from "@prisma/client";
import type { RecipeContentProvider } from "./content/provider/types.js";

export interface GraphQLContext {
  prisma: PrismaClient;
  recipeContent: RecipeContentProvider;
  authHeader: string | undefined;
  sessionKey: string;
}

export function createContext(params: {
  prisma: PrismaClient;
  recipeContent: RecipeContentProvider;
  authHeader: string | undefined;
  sessionKey: string;
}): GraphQLContext {
  return {
    prisma: params.prisma,
    recipeContent: params.recipeContent,
    authHeader: params.authHeader,
    sessionKey: params.sessionKey,
  };
}
