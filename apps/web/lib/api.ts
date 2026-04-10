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
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body:
      options.body === undefined || options.body instanceof FormData
        ? (options.body as BodyInit | undefined)
        : JSON.stringify(options.body),
    credentials: "include",
    cache: "no-store",
  }).catch((error: unknown) => {
    throw new ApiError(
      "WaveStream API is not reachable yet. The frontend shell still compiles safely.",
      503,
      error,
    );
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(
      typeof details === "object" && details && "message" in details
        ? String((details as { message: string }).message)
        : `Request failed with status ${response.status}`,
      response.status,
      details,
    );
  }

  return (await response.json()) as T;
}
