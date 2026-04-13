import type { PrismaClient } from "@prisma/client";
import { getRecipeSource } from "../config.js";
import { FileRecipeContentProvider } from "./fileProvider.js";
import { PrismaRecipeContentProvider } from "./prismaProvider.js";
import type { RecipeContentProvider } from "./types.js";

export function createRecipeContentProvider(
  prisma: PrismaClient
): RecipeContentProvider {
  if (getRecipeSource() === "files") {
    return new FileRecipeContentProvider();
  }
  return new PrismaRecipeContentProvider(prisma);
}
