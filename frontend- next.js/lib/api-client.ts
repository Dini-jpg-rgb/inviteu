export const AUTH_TOKEN_STORAGE_KEY = "inviteu_token";
export const DEMO_AUTH_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH === "true";

export function isMockAuthToken(token: string | null | undefined) {
  return token?.startsWith("mock_token_") ?? false;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

function getApiUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL belum dikonfigurasi.");
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

export function apiPublicRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(getApiUrl(path), init);
}

export function apiAuthenticatedRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window === "undefined") {
    throw new Error("Request terautentikasi hanya dapat dijalankan di browser.");
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error("Token autentikasi tidak ditemukan. Silakan masuk kembali.");
  }
  if (isMockAuthToken(token)) {
    throw new Error("Token demo tidak dapat digunakan untuk mengakses backend.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(getApiUrl(path), {
    ...init,
    headers,
  });
}
