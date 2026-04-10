export type AuthStatus = "booting" | "authenticated" | "guest";

export type AuthUserSnapshot = {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  trackCount?: number;
  playlistCount?: number;
  profile?:
    | {
        bio?: string | null;
        avatarUrl?: string | null;
        bannerUrl?: string | null;
        websiteUrl?: string | null;
        location?: string | null;
      }
    | null;
  createdAt?: string;
};

export type AuthSessionSnapshot = {
  status: AuthStatus;
  user: AuthUserSnapshot | null;
  accessToken: string | null;
};

export type AuthSessionValue =
  | {
      user: AuthUserSnapshot;
      tokens: {
        accessToken: string;
      };
    }
  | {
      user: AuthUserSnapshot;
      accessToken: string;
    };

type Listener = () => void;

const listeners = new Set<Listener>();

let sessionSnapshot: AuthSessionSnapshot = {
  status: "booting",
  user: null,
  accessToken: null,
};

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setSessionSnapshot = (next: AuthSessionSnapshot) => {
  sessionSnapshot = next;
  emit();
};

const normalizeSession = (session: AuthSessionValue) =>
  "tokens" in session
    ? {
        user: session.user,
        accessToken: session.tokens.accessToken,
      }
    : session;

export const getAuthSessionSnapshot = () => sessionSnapshot;

export const subscribeAuthSession = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const setBootingSession = () => {
  setSessionSnapshot({
    status: "booting",
    user: null,
    accessToken: null,
  });
};

export const setAuthenticatedSession = (session: AuthSessionValue) => {
  const normalized = normalizeSession(session);
  setSessionSnapshot({
    status: "authenticated",
    user: normalized.user,
    accessToken: normalized.accessToken,
  });
};

export const clearSession = () => {
  setSessionSnapshot({
    status: "guest",
    user: null,
    accessToken: null,
  });
};

export const hasAuthSession = () => sessionSnapshot.status === "authenticated";

export const getAccessToken = () => sessionSnapshot.accessToken;
