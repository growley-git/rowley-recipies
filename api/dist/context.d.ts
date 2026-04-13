import type { PrismaClient } from "@prisma/client";
export interface GraphQLContext {
    prisma: PrismaClient;
    authHeader: string | undefined;
    sessionKey: string;
}
export declare function createContext(params: {
    prisma: PrismaClient;
    authHeader: string | undefined;
    sessionKey: string;
}): GraphQLContext;
//# sourceMappingURL=context.d.ts.map