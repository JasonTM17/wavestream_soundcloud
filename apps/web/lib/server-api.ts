const normalizeUrl = (value?: string | null) => value?.replace(/\/$/, "") ?? null;

export const SERVER_API_URL =
  normalizeUrl(process.env.INTERNAL_API_URL) ??
  normalizeUrl(process.env.NEXT_PUBLIC_API_URL) ??
  "http://localhost:4000";
