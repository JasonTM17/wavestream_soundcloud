import {
  clearSession,
  getAccessToken,
  setAuthenticatedSession,
  type AuthSessionValue,
} from "@/lib/auth-session";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: "optional" | "required" | "none";
};

export type RequestAuthMode = RequestOptions["auth"];

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  meta?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isApiEnvelope = <T>(value: unknown): value is ApiEnvelope<T> =>
  isObject(value) && "success" in value && "data" in value;

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => "");
}

const AUTH_ENDPOINT_PREFIX = "/api/auth/";

const isAuthEndpoint = (path: string) => path.startsWith(AUTH_ENDPOINT_PREFIX);

const requestWithAuth = async (path: string, options: RequestOptions) => {
  const headers = new Headers(options.headers ?? {});
  const body =
    options.body === undefined || options.body instanceof FormData
      ? (options.body as BodyInit | undefined)
      : JSON.stringify(options.body);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = options.auth === "none" ? null : getAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: Object.fromEntries(headers.entries()),
    body,
    credentials: "include",
    cache: "no-store",
  }).catch((error: unknown) => {
    throw new ApiError(
      "WaveStream API is not reachable yet. The frontend shell still compiles safely.",
      503,
      error,
    );
  });
};

let refreshSessionPromise: Promise<AuthSessionValue | null> | null = null;

async function readAuthSession(response: Response): Promise<AuthSessionValue | null> {
  const payload = await parseResponse(response);
  const session = isObject(payload) && "data" in payload ? payload.data : payload;

  if (!isObject(session) || !isObject((session as Record<string, unknown>).user)) {
    return null;
  }

  const user = (session as { user: AuthSessionValue["user"] }).user;
  const tokenSource = session as
    | {
        tokens?: { accessToken?: string };
        accessToken?: string;
        user: AuthSessionValue["user"];
      }
    | undefined;

  const accessToken =
    tokenSource && typeof tokenSource.accessToken === "string"
      ? tokenSource.accessToken
      : tokenSource?.tokens?.accessToken;

  if (typeof accessToken !== "string" || !accessToken) {
    return null;
  }

  return {
    user,
    accessToken,
  };
}

export async function refreshAuthSession() {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }).catch(() => null);

      if (!response) {
        clearSession();
        return null;
      }

      if (!response.ok) {
        clearSession();
        return null;
      }

      const session = await readAuthSession(response);
      if (!session) {
        clearSession();
        return null;
      }

      setAuthenticatedSession(session);
      return session;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshSessionPromise = null;
    }
  })();

  return refreshSessionPromise;
}

function createApiErrorFromResponse(response: Response, details: unknown) {
  return new ApiError(
    isObject(details) && "message" in details
      ? String((details as { message: string }).message)
      : `Request failed with status ${response.status}`,
    response.status,
    details,
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const authMode = options.auth ?? "optional";
  const shouldAttemptRefresh = authMode !== "none" && !isAuthEndpoint(path);

  const execute = async (allowRefresh: boolean) => {
    const response = await requestWithAuth(path, options);

    if (response.ok) {
      const payload = await parseResponse(response);
      if (isApiEnvelope<T>(payload)) {
        return (payload.data ?? payload) as T;
      }

      return payload as T;
    }

    if (response.status === 401 && allowRefresh && shouldAttemptRefresh) {
      const session = await refreshAuthSession();
      if (session) {
        const retryResponse = await requestWithAuth(path, options);
        if (retryResponse.ok) {
          const retryPayload = await parseResponse(retryResponse);
          if (isApiEnvelope<T>(retryPayload)) {
            return (retryPayload.data ?? retryPayload) as T;
          }

          return retryPayload as T;
        }

        const retryDetails = await parseResponse(retryResponse);
        throw createApiErrorFromResponse(retryResponse, retryDetails);
      }
    }

    const details = await parseResponse(response);
    throw createApiErrorFromResponse(response, details);
  };

  try {
    return await execute(true);
  } catch (error) {
    if (error instanceof ApiError || authMode === "none") {
      throw error;
    }

    throw new ApiError(
      "WaveStream API is not reachable yet. The frontend shell still compiles safely.",
      503,
      error,
    );
  }
}
