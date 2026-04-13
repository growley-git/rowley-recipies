import { getRecipeSource } from "../config.js";
import { FileRecipeContentProvider } from "./fileProvider.js";
import { PrismaRecipeContentProvider } from "./prismaProvider.js";
export function createRecipeContentProvider(prisma) {
    if (getRecipeSource() === "files") {
        return new FileRecipeContentProvider();
    }
    return new PrismaRecipeContentProvider(prisma);
}
//# sourceMappingURL=factory.js.map