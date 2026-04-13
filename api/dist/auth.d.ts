export declare function signAdminToken(): {
    token: string;
    expiresAt: Date;
};
export declare function verifyAdminToken(authHeader: string | undefined): boolean;
export declare function assertAdmin(authHeader: string | undefined): void;
export declare function checkAdminPassword(password: string): boolean;
//# sourceMappingURL=auth.d.ts.map