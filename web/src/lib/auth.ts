const KEY = "rr_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
}
