import Cookies from "js-cookie";

// ─── Config ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
const TOKEN_COOKIE = "access_token"; // change to match your cookie name

// ─── Types ─────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass `true` to skip attaching the Authorization header (e.g. login, refresh). */
  public?: boolean;
  /** Next.js fetch cache/revalidation options (server components). */
  next?: NextFetchRequestConfig;
formEncoded?: boolean;

}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ─── Header builder ────────────────────────────────────────────────────────

function buildHeaders(isPublic = false, extra: Record<string, string> = {}, formEncoded = false): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": formEncoded ? "application/x-www-form-urlencoded" : "application/json",
    ...extra,
  };

  if (!isPublic) {
    const token = Cookies.get(TOKEN_COOKIE);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    headers: extraHeaders = {},
    public: isPublic = false,
    next,
  } = options;

  const { formEncoded = false } = options;

const config: RequestInit = {
  method,
  credentials: "include",
  headers: buildHeaders(isPublic, extraHeaders, formEncoded),
  ...(body !== undefined && {
    body: formEncoded
      ? new URLSearchParams(body as Record<string, string>)
      : JSON.stringify(body),
  }),
};

  try {
    const res = await fetch(`${BASE_URL}${path}`, config);

    // No content
    if (res.status === 204) {
      return { data: null, error: null, status: res.status };
    }

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        // ← skip refresh logic entirely for auth routes
        if (isPublic || path.startsWith("/auth")) {
          const message =
            typeof json?.message === "string"
              ? json.message
              : typeof json?.detail === "string"
              ? json.detail
              : "Invalid credentials.";
          return { data: null, error: message, status: 401 };
        }

        Cookies.remove(TOKEN_COOKIE);

        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: buildHeaders(true),
          });

          if (!refreshRes.ok) throw new Error("Refresh failed");

          const refreshData = await refreshRes.json();
          Cookies.set(TOKEN_COOKIE, refreshData.access_token, { expires: 1 });

          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...config,
            credentials: "include",
            headers: buildHeaders(false),
          });
          const retryJson = await retryRes.json();
          return { data: retryJson as T, error: null, status: retryRes.status };

        } catch (err) {
          Cookies.remove(TOKEN_COOKIE);
          window.location.href = "/"; // ← only redirects for non-auth 401s
          return { data: null, error: "Session expired. Please log in again.", status: 401 };
        }
      }

      const message =
        typeof json?.message === "string"
          ? json.message
          : typeof json?.detail === "string"
          ? json.detail
          : `Request failed with status ${res.status}`;
      return { data: null, error: message, status: res.status };
    }

    return { data: json as T, error: null, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: message, status: 0 };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

// ─── Usage examples ─────────────────────────────────────────────────────────
//
// Authenticated GET:
//   const { data, error } = await api.get<User[]>("/users");
//
// Public POST (login — no Authorization header):
//   const { data, error } = await api.post<AuthResponse>(
//     "/auth/login",
//     { email, password },
//     { public: true }
//   );
//
// Server Component with Next.js revalidation:
//   const { data } = await api.get<Product[]>("/products", {
//     next: { revalidate: 60 },
//   });