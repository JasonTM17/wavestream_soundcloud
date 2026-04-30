#!/usr/bin/env node

const DEFAULTS = {
  webUrl: "http://localhost:3000",
  apiUrl: "http://localhost:4000",
  privateOwnerEmail: "miko@wavestream.demo",
  privateOwnerPassword: "DemoPass123!",
};

const env = {
  webUrl: normalizeBaseUrl(process.env.SMOKE_WEB_URL ?? DEFAULTS.webUrl),
  apiUrl: normalizeBaseUrl(process.env.SMOKE_API_URL ?? DEFAULTS.apiUrl),
  privateOwnerEmail:
    process.env.SMOKE_PRIVATE_OWNER_EMAIL ?? DEFAULTS.privateOwnerEmail,
  privateOwnerPassword:
    process.env.SMOKE_PRIVATE_OWNER_PASSWORD ?? DEFAULTS.privateOwnerPassword,
};

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl, path) {
  return new URL(path, `${baseUrl}/`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapData(payload) {
  if (isObject(payload) && "data" in payload && payload.data !== undefined) {
    return payload.data;
  }

  return payload;
}

function getPayloadArray(payload, key) {
  const source = unwrapData(payload);

  if (Array.isArray(source)) {
    return source;
  }

  if (isObject(source) && Array.isArray(source[key])) {
    return source[key];
  }

  return [];
}

function getPayloadObject(payload, key) {
  const source = unwrapData(payload);

  if (isObject(source) && key in source && isObject(source[key])) {
    return source[key];
  }

  return isObject(source) ? source : null;
}

function getFirstObject(items) {
  return items.find(isObject) ?? null;
}

function splitSetCookieHeader(value) {
  if (!value) {
    return [];
  }

  return value
    .split(/,(?=\s*[^;=]+=[^;]+)/g)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function extractCookieValue(setCookieHeader, cookieName) {
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : splitSetCookieHeader(setCookieHeader);

  for (const cookie of cookies) {
    const match = cookie.match(new RegExp(`^${cookieName}=([^;]+)`));
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function formatError(label, response, bodyText) {
  const snippet = bodyText?.trim().slice(0, 240);
  return new Error(
    `${label} failed with ${response.status} ${response.statusText}${snippet ? `: ${snippet}` : ""}`,
  );
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`Timed out fetching ${url}`)), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: init.headers,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, init = {}, label = url.toString()) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw formatError(label, response, text);
  }

  if (!text) {
    return { response, payload: null };
  }

  try {
    return { response, payload: JSON.parse(text) };
  } catch {
    throw new Error(`${label} returned non-JSON content.`);
  }
}

async function fetchText(url, init = {}, label = url.toString()) {
  const response = await fetchWithTimeout(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw formatError(label, response, text);
  }

  return { response, text };
}

async function waitFor(label, check, options = {}) {
  const timeoutMs = options.timeoutMs ?? 300_000;
  const intervalMs = options.intervalMs ?? 5_000;
  const startedAt = Date.now();
  let attempt = 0;
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;

    try {
      const result = await check();
      console.log(`[smoke] ${label} ok after ${attempt} attempt${attempt === 1 ? "" : "s"}`);
      return result;
    } catch (error) {
      lastError = error;
      await sleep(intervalMs);
    }
  }

  throw new Error(
    `${label} did not become ready in time${lastError ? `: ${lastError instanceof Error ? lastError.message : String(lastError)}` : ""}`,
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertPageReachable(url, label, expectedPathname) {
  const { text } = await fetchText(url, {}, label);

  const pathname = new URL(url).pathname;
  assert(text.includes("WaveStream"), `${label} did not include the WaveStream brand.`);
  assert(
    pathname === expectedPathname || pathname === `${expectedPathname}/`,
    `${label} was requested with an unexpected pathname: ${pathname}`,
  );

  console.log(`[smoke] ${label} reachable`);
}

async function getDiscoveryFixtures() {
  const { payload } = await fetchJson(
    buildUrl(env.apiUrl, "/api/discovery/home"),
    {},
    "discovery home API",
  );
  const discovery = getPayloadObject(payload, "data") ?? unwrapData(payload);

  const track =
    getFirstObject(getPayloadArray(discovery, "trending")) ??
    getFirstObject(getPayloadArray(discovery, "recentUploads")) ??
    getFirstObject(getPayloadArray(discovery, "newReleases"));

  const playlist = getFirstObject(getPayloadArray(discovery, "popularPlaylists"));
  const artist =
    (isObject(track) && isObject(track.artist) ? track.artist : null) ??
    getFirstObject(getPayloadArray(discovery, "featuredArtists"));

  assert(
    isObject(track) &&
      typeof track.id === "string" &&
      typeof track.slug === "string" &&
      isObject(track.artist) &&
      typeof track.artist.username === "string",
    "Unable to resolve a public track from discovery data.",
  );

  assert(
    isObject(playlist) &&
      typeof playlist.id === "string" &&
      typeof playlist.slug === "string",
    "Unable to resolve a public playlist from discovery data.",
  );

  assert(
    isObject(artist) &&
      typeof artist.id === "string" &&
      typeof artist.username === "string",
    "Unable to resolve a featured artist from discovery data.",
  );

  return { track, playlist, artist };
}

async function resolveTrackBySlugAndId(track) {
  const { payload } = await fetchJson(
    buildUrl(env.apiUrl, `/api/tracks/${encodeURIComponent(track.slug)}`),
    {},
    "track API by slug",
  );
  const bySlug = getPayloadObject(payload, "track") ?? unwrapData(payload);

  assert(
    isObject(bySlug) && bySlug.id === track.id && bySlug.slug === track.slug,
    "Track API did not resolve slug to the expected track.",
  );

  const { payload: byIdPayload } = await fetchJson(
    buildUrl(env.apiUrl, `/api/tracks/${encodeURIComponent(track.id)}`),
    {},
    "track API by id",
  );
  const byId = getPayloadObject(byIdPayload, "track") ?? unwrapData(byIdPayload);

  assert(
    isObject(byId) && byId.id === track.id && byId.slug === track.slug,
    "Track API did not resolve id to the expected track.",
  );
}

async function resolvePlaylistBySlugAndId(playlist) {
  const { payload } = await fetchJson(
    buildUrl(env.apiUrl, `/api/playlists/${encodeURIComponent(playlist.slug)}`),
    {},
    "playlist API by slug",
  );
  const bySlug = getPayloadObject(payload, "playlist") ?? unwrapData(payload);

  assert(
    isObject(bySlug) &&
      bySlug.id === playlist.id &&
      bySlug.slug === playlist.slug,
    "Playlist API did not resolve slug to the expected playlist.",
  );

  const { payload: byIdPayload } = await fetchJson(
    buildUrl(env.apiUrl, `/api/playlists/${encodeURIComponent(playlist.id)}`),
    {},
    "playlist API by id",
  );
  const byId = getPayloadObject(byIdPayload, "playlist") ?? unwrapData(byIdPayload);

  assert(
    isObject(byId) && byId.id === playlist.id && byId.slug === playlist.slug,
    "Playlist API did not resolve id to the expected playlist.",
  );
}

async function resolveArtistByUsername(artist) {
  const { payload } = await fetchJson(
    buildUrl(env.apiUrl, `/api/users/${encodeURIComponent(artist.username)}`),
    {},
    "artist profile API",
  );
  const profile = getPayloadObject(payload, "user") ?? unwrapData(payload);

  assert(
    isObject(profile) &&
      profile.id === artist.id &&
      profile.username === artist.username,
    "Artist API did not resolve the expected profile.",
  );
}

async function loginAsOwner() {
  const { response, payload } = await fetchJson(
    buildUrl(env.apiUrl, "/api/auth/login"),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: env.privateOwnerEmail,
        password: env.privateOwnerPassword,
      }),
    },
    "owner login",
  );

  const session = unwrapData(payload);
  const sessionTokens = isObject(session) && isObject(session.tokens) ? session.tokens : null;
  const payloadTokens =
    isObject(payload) && isObject(payload.tokens)
      ? payload.tokens
      : isObject(payload) && isObject(payload.data) && isObject(payload.data.tokens)
        ? payload.data.tokens
        : null;
  const accessToken = sessionTokens?.accessToken ?? payloadTokens?.accessToken ?? null;

  assert(
    typeof accessToken === "string" && accessToken.length > 0,
    "Owner login did not return an access token.",
  );

  const refreshCookie = extractCookieValue(
    splitSetCookieHeader(response.headers.get("set-cookie")),
    "wavestream_refresh_token",
  );

  assert(
    typeof refreshCookie === "string" && refreshCookie.length > 0,
    "Owner login did not return a refresh cookie.",
  );

  return {
    accessToken,
    refreshCookie,
    user: getPayloadObject(payload, "user") ?? payload?.user ?? null,
  };
}

async function getOwnerPrivateTrackId(accessToken) {
  const { payload } = await fetchJson(
    buildUrl(env.apiUrl, "/api/tracks/me/uploads"),
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    },
    "owner uploads",
  );

  const uploads = getPayloadArray(payload, "data");
  const privateTrack = uploads.find((track) => {
    if (!isObject(track)) {
      return false;
    }

    const privacy = typeof track.privacy === "string" ? track.privacy.toLowerCase() : "";
    return privacy === "private";
  });

  assert(
    isObject(privateTrack) && typeof privateTrack.id === "string",
    "Unable to resolve a private owner track from the owner's uploads.",
  );

  return privateTrack;
}

async function verifyPrivateProxyStream(trackId, refreshCookie) {
  const response = await fetchWithTimeout(
    buildUrl(env.webUrl, `/api/media/tracks/${encodeURIComponent(trackId)}/stream`),
    {
      headers: {
        cookie: `wavestream_refresh_token=${refreshCookie}`,
        range: "bytes=0-127",
      },
    },
    30_000,
  );
  const streamBytes = new Uint8Array(await response.arrayBuffer());

  assert(
    response.status === 200 || response.status === 206,
    `Private proxy stream returned ${response.status} ${response.statusText}.`,
  );

  const contentType = response.headers.get("content-type") ?? "";
  assert(
    contentType.includes("audio/") || contentType.includes("application/octet-stream"),
    `Private proxy stream returned an unexpected content type: ${contentType || "<missing>"}.`,
  );

  assert(streamBytes.byteLength > 0, "Private proxy stream response body was empty.");

  if (response.status === 206) {
    assert(
      Boolean(response.headers.get("content-range")),
      "Partial proxy stream response was missing Content-Range.",
    );
  }

  console.log("[smoke] private owner proxy stream ok");
}

async function main() {
  console.log("[smoke] starting WaveStream Docker verification");

  await waitFor("API health", async () => {
    const { response, payload } = await fetchJson(
      buildUrl(env.apiUrl, "/api/health"),
      {},
      "api health",
    );
    const health = unwrapData(payload);

    assert(response.ok, "API health check returned a non-OK response.");
    if (isObject(health) && "status" in health) {
      assert(health.status === "ok" || health.status === "healthy", "API health status was not healthy.");
    }

    return health;
  });

  await waitFor("Web root", async () => {
    const { response, text } = await fetchText(buildUrl(env.webUrl, "/"), {}, "web root");

    assert(response.ok, "Web root returned a non-OK response.");
    assert(text.includes("WaveStream"), "Web root did not include the WaveStream brand.");
    return text;
  });

  const { track, playlist, artist } = await getDiscoveryFixtures();
  await resolveTrackBySlugAndId(track);
  await resolvePlaylistBySlugAndId(playlist);
  await resolveArtistByUsername(artist);

  await assertPageReachable(
    buildUrl(env.webUrl, `/artist/${encodeURIComponent(artist.username)}`),
    "public artist page",
    `/artist/${encodeURIComponent(artist.username)}`,
  );

  await assertPageReachable(
    buildUrl(env.webUrl, `/track/${encodeURIComponent(track.slug)}`),
    "public track page",
    `/track/${encodeURIComponent(track.slug)}`,
  );

  await assertPageReachable(
    buildUrl(env.webUrl, `/playlist/${encodeURIComponent(playlist.slug)}`),
    "public playlist page",
    `/playlist/${encodeURIComponent(playlist.slug)}`,
  );

  const session = await loginAsOwner();
  const privateTrack = await getOwnerPrivateTrackId(session.accessToken);
  await verifyPrivateProxyStream(privateTrack.id, session.refreshCookie);

  console.log("[smoke] all Docker checks passed");
}

main().catch((error) => {
  console.error("[smoke] verification failed");
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
