export function createContext(params) {
    return {
        prisma: params.prisma,
        authHeader: params.authHeader,
        sessionKey: params.sessionKey,
    };
}
//# sourceMappingURL=context.js.map