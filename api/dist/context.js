export function createContext(params) {
    return {
        prisma: params.prisma,
        recipeContent: params.recipeContent,
        authHeader: params.authHeader,
        sessionKey: params.sessionKey,
    };
}
//# sourceMappingURL=context.js.map