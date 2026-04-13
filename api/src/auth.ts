import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export function signAdminToken(): { token: string; expiresAt: Date } {
  const expiresIn = "7d";
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn });
  return { token, expiresAt };
}

export function verifyAdminToken(
  authHeader: string | undefined
): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string };
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function assertAdmin(authHeader: string | undefined): void {
  if (!verifyAdminToken(authHeader)) {
    const err = new Error("Unauthorized");
    (err as NodeJS.ErrnoException).code = "UNAUTH";
    throw err;
  }
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "rowley-dev";
  if (password.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}
