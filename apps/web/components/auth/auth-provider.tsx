"use client";

import * as React from "react";

import { refreshAuthSession } from "@/lib/api";
import { useAuthActions, useAuthSession } from "@/lib/auth-store";
import { setBootingSession } from "@/lib/auth-session";

let bootstrapStarted = false;

export function AuthProvider({ children }: React.PropsWithChildren) {
  React.useEffect(() => {
    if (bootstrapStarted) {
      return;
    }

    bootstrapStarted = true;
    setBootingSession();
    void refreshAuthSession();
  }, []);

  return children;
}

export { useAuthActions, useAuthSession };
