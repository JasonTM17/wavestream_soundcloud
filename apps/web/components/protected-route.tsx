"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserRole } from "@wavestream/shared";
import { toast } from "sonner";

import { useAuthSession } from "@/lib/auth-store";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireRole?: "creator";
};

function buildReturnTo(pathname: string, searchParams: { toString(): string }) {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function sanitizeNextTarget(nextValue: string | null, fallback: string) {
  const candidate = nextValue?.trim();

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("://")) {
    return fallback;
  }

  if (candidate === "/sign-in" || candidate === "/sign-up") {
    return fallback;
  }

  return candidate;
}

function GateScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.45)] backdrop-blur-xl">
        <div className="space-y-2">
          <p className="text-lg font-semibold tracking-tight">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-primary/70" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, user, isAuthenticated, isBooting } = useAuthSession();
  const [hasMounted, setHasMounted] = React.useState(false);
  const redirectingRef = React.useRef(false);
  const currentPath = React.useMemo(
    () => buildReturnTo(pathname, searchParams),
    [pathname, searchParams],
  );
  const signInTarget = React.useMemo(
    () => `/sign-in?next=${encodeURIComponent(currentPath)}`,
    [currentPath],
  );
  const hasCreatorAccess = user?.role === UserRole.CREATOR || user?.role === UserRole.ADMIN;
  const requiresCreatorAccess = requireRole === "creator";

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!hasMounted || status === "booting" || redirectingRef.current) {
      return;
    }

    if (!isAuthenticated) {
      redirectingRef.current = true;
      router.replace(signInTarget);
      return;
    }

    if (requiresCreatorAccess && !hasCreatorAccess) {
      redirectingRef.current = true;
      toast.error("Creator access required.");
      router.replace("/discover");
    }
  }, [hasCreatorAccess, hasMounted, isAuthenticated, requiresCreatorAccess, router, signInTarget, status]);

  if (!hasMounted || isBooting) {
    return (
      <GateScreen
        title="Checking your session"
        description="Restoring your access before loading this protected area."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <GateScreen
        title="Redirecting to sign in"
        description="This area requires an authenticated session."
      />
    );
  }

  if (requiresCreatorAccess && !hasCreatorAccess) {
    return (
      <GateScreen
        title="Redirecting to Discover"
        description="Creator access is required for this dashboard."
      />
    );
  }

  return <>{children}</>;
}

export function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, isAuthenticated } = useAuthSession();
  const [hasMounted, setHasMounted] = React.useState(false);
  const redirectingRef = React.useRef(false);
  const nextTarget = React.useMemo(
    () => sanitizeNextTarget(searchParams.get("next"), "/discover"),
    [searchParams],
  );

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (!hasMounted || status !== "authenticated" || redirectingRef.current) {
      return;
    }

    redirectingRef.current = true;
    router.replace(nextTarget);
  }, [hasMounted, nextTarget, router, status]);

  if (!hasMounted || status === "booting") {
    return (
      <GateScreen
        title="Restoring your session"
        description="One moment while we verify your account and route you to the right place."
      />
    );
  }

  if (isAuthenticated) {
    return (
      <GateScreen
        title="Taking you back in"
        description="You are already signed in, so we are moving you to your destination."
      />
    );
  }

  return <>{children}</>;
}
