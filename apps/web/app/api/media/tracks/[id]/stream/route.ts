import { NextRequest } from "next/server";
import { SERVER_API_URL } from "@/lib/server-api";

const MEDIA_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

const REFRESH_COOKIE_NAME = "wavestream_refresh_token";

type RefreshSessionShape = {
  accessToken?: string;
  tokens?: {
    accessToken?: string;
  };
};

type AuthRefreshPayload = RefreshSessionShape & {
  data?: RefreshSessionShape;
};

function createMediaErrorResponse(status: number) {
  return new Response(null, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function copyMediaHeaders(source: Response) {
  const headers = new Headers();

  for (const headerName of MEDIA_HEADERS) {
    const value = source.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  const rotatedRefreshCookie = source.headers.get("set-cookie");
  if (rotatedRefreshCookie) {
    headers.set("set-cookie", rotatedRefreshCookie);
  }

  return headers;
}

function extractAccessToken(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as AuthRefreshPayload;
  const data = typedPayload.data ?? typedPayload;
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("accessToken" in data && typeof data.accessToken === "string") {
    return data.accessToken;
  }

  if (
    "tokens" in data &&
    data.tokens &&
    typeof data.tokens === "object" &&
    typeof data.tokens.accessToken === "string"
  ) {
    return data.tokens.accessToken;
  }

  return null;
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchStream(id: string, range: string | null, accessToken?: string) {
  const headers: Record<string, string> = {};
  if (range) {
    headers.range = range;
  }
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${SERVER_API_URL}/api/tracks/${encodeURIComponent(id)}/stream`, {
    method: "GET",
    headers,
    cache: "no-store",
  });
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${SERVER_API_URL}/api/auth/refresh`, {
    method: "POST",
    cache: "no-store",
    headers: {
      cookie: `${REFRESH_COOKIE_NAME}=${refreshToken}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
    };
  }

  const payload = await parseJson(response);
  const accessToken = extractAccessToken(payload);
  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
    };
  }

  return {
    ok: true as const,
    accessToken,
    rotatedRefreshCookie: response.headers.get("set-cookie"),
  };
}

async function proxyTrackStream(id: string, range: string | null, refreshToken?: string) {
  const initialResponse = await fetchStream(id, range);
  if (initialResponse.ok) {
    return initialResponse;
  }

  const shouldRetry =
    refreshToken && (initialResponse.status === 401 || initialResponse.status === 403);
  if (!shouldRetry) {
    return createMediaErrorResponse(initialResponse.status);
  }

  const refreshResult = await refreshAccessToken(refreshToken);
  if (!refreshResult.ok) {
    return createMediaErrorResponse(initialResponse.status);
  }

  const retriedResponse = await fetchStream(id, range, refreshResult.accessToken);
  if (!retriedResponse.ok) {
    return createMediaErrorResponse(retriedResponse.status);
  }

  const headers = copyMediaHeaders(retriedResponse);
  if (refreshResult.rotatedRefreshCookie) {
    headers.set("set-cookie", refreshResult.rotatedRefreshCookie);
  }

  return new Response(retriedResponse.body, {
    status: retriedResponse.status,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  const params = await context.params;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const range = request.headers.get("range");

  const response = await proxyTrackStream(params.id, range, refreshToken);

  if (!response.ok && response.headers.get("cache-control") !== "no-store") {
    return createMediaErrorResponse(response.status);
  }

  if (response.headers.get("cache-control") === "no-store" && !response.body) {
    return response;
  }

  if (!response.body) {
    return response;
  }

  if (response.headers.get("cache-control") === "no-store") {
    return response;
  }

  const headers = copyMediaHeaders(response);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
