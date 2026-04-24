import Cookies from "js-cookie";

// ─── Config ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const TOKEN_COOKIE = "access_token";

if (!BASE_URL) {
  throw new Error("BASE_URL is not defined. Please set NEXT_PUBLIC_BASE_URL in your environment variables.");
}

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

// ─── Token reader (isomorphic) ─────────────────────────────────────────────

async function getToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    // Dynamically import so next/headers is never bundled into the client
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    return cookieStore.get(TOKEN_COOKIE)?.value;
  }
  // Client context — read from js-cookie
  return Cookies.get(TOKEN_COOKIE);
}

function removeToken(): void {
  if (typeof window === "undefined") {
    // No-op on server; can't mutate cookies here without a Response object
    return;
  }
  Cookies.remove(TOKEN_COOKIE);
}

function setToken(value: string): void {
  if (typeof window === "undefined") {
    // No-op on server
    return;
  }
  Cookies.set(TOKEN_COOKIE, value, { expires: 1 });
}

// ─── Header builder ────────────────────────────────────────────────────────

async function buildHeaders(
  isPublic = false,
  extra: Record<string, string> = {},
  formEncoded = false
): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": formEncoded
      ? "application/x-www-form-urlencoded"
      : "application/json",
    ...extra,
  };

  if (!isPublic) {
    const token = await getToken();
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
    formEncoded = false,
  } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: await buildHeaders(isPublic, extraHeaders, formEncoded),
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
        // Skip refresh logic for auth routes
        if (isPublic || path.startsWith("/auth")) {
          const message =
            typeof json?.message === "string"
              ? json.message
              : typeof json?.detail === "string"
              ? json.detail
              : "Invalid credentials.";
          return { data: null, error: message, status: 401 };
        }

        removeToken();

        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: await buildHeaders(true),
          });

          if (!refreshRes.ok) throw new Error("Refresh failed");

          const refreshData = await refreshRes.json();
          setToken(refreshData.access_token);

          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...config,
            credentials: "include",
            headers: await buildHeaders(false),
          });
          const retryJson = await retryRes.json();
          return { data: retryJson as T, error: null, status: retryRes.status };

        } catch (err) {
          removeToken();

          if (typeof window !== "undefined") {
            window.location.href = "/login";
          } else {
            const { redirect } = await import("next/navigation");
            redirect("/");
          }

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
// Authenticated GET (client or server component):
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