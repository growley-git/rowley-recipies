import type { PrismaClient } from "@prisma/client";

export interface GraphQLContext {
  prisma: PrismaClient;
  authHeader: string | undefined;
  sessionKey: string;
}

export function createContext(params: {
  prisma: PrismaClient;
  authHeader: string | undefined;
  sessionKey: string;
}): GraphQLContext {
  return {
    prisma: params.prisma,
    authHeader: params.authHeader,
    sessionKey: params.sessionKey,
  };
}
