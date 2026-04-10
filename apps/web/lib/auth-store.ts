"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";

import { apiRequest } from "@/lib/api";
import {
  clearSession,
  getAuthSessionSnapshot,
  setAuthenticatedSession,
  subscribeAuthSession,
  type AuthSessionSnapshot,
  type AuthSessionValue,
} from "@/lib/auth-session";

export type { AuthSessionSnapshot };

export function useAuthSession() {
  const snapshot = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot,
  );

  return React.useMemo(
    () => ({
      ...snapshot,
      isBooting: snapshot.status === "booting",
      isAuthenticated: snapshot.status === "authenticated",
      isGuest: snapshot.status === "guest",
    }),
    [snapshot],
  );
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
    auth: "none",
  })
    .catch(() => null)
    .finally(() => {
      clearSession();
    });
}

export function useAuthActions() {
  return React.useMemo(
    () => ({
      setAuthenticatedSession: (session: AuthSessionValue) =>
        setAuthenticatedSession(session),
      clearSession,
      logout,
    }),
    [],
  );
}
