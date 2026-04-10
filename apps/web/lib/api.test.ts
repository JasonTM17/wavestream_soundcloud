import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ApiModule = typeof import("./api");

let apiModule: ApiModule;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.wavestream.test");
  apiModule = await import("./api");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("apiRequest", () => {
  it("returns the data payload from an API envelope and sends JSON bodies", async () => {
    const response = new Response(JSON.stringify({ success: true, data: { ok: true } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    const result = await apiModule.apiRequest<{ ok: boolean }>("/api/ping", {
      method: "POST",
      body: { hello: "world" },
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.wavestream.test/api/ping");
    expect(init?.credentials).toBe("include");
    expect(init?.cache).toBe("no-store");
    const headers = new Headers(init?.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer test-token");
    expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
  });

  it("returns raw payloads when the API does not use an envelope", async () => {
    const response = new Response("pong", {
      status: 200,
      headers: {
        "content-type": "text/plain",
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    const result = await apiModule.apiRequest<string>("/api/ping");

    expect(result).toBe("pong");
  });

  it("preserves multipart form data without forcing a JSON content type", async () => {
    const response = new Response(JSON.stringify({ success: true, data: { ok: true } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    const formData = new FormData();
    formData.append("title", "Midnight Static");
    formData.append(
      "audioFile",
      new File(["demo-audio"], "midnight-static.wav", { type: "audio/wav" }),
    );

    const result = await apiModule.apiRequest<{ ok: boolean }>("/api/tracks", {
      method: "POST",
      auth: "required",
      body: formData,
    });

    expect(result).toEqual({ ok: true });

    const [, init] = fetchSpy.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("content-type")).toBeNull();
    expect(init?.body).toBe(formData);
  });

  it("throws a structured ApiError for non-ok responses and network failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    await expect(apiModule.apiRequest("/api/auth/login")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Invalid credentials",
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("offline"));

    await expect(apiModule.apiRequest("/api/auth/login")).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      message: "WaveStream API is not reachable yet. The frontend shell still compiles safely.",
    });
  });
});
