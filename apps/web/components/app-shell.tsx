"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Compass,
  BellRing,
  LibraryBig,
  LogOut,
  Music4,
  Search,
  Sparkles,
  Upload,
  UserCircle2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { useAuthActions, useAuthSession } from "@/components/auth/auth-provider";
import { SiteCredits } from "@/components/site-credits";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { MiniPlayer } from "@/components/player/mini-player";
import { useCurrentUserQuery, useNotificationsQuery } from "@/lib/wavestream-queries";
import { usePlayerStore } from "@/lib/player-store";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/creator", label: "Creator", icon: Upload },
];

export function AppShell({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const queueLength = usePlayerStore((state) => state.queue.length);
  const [isLoggingOut, startLogoutTransition] = React.useTransition();
  const { isAuthenticated, isBooting, user: sessionUser } = useAuthSession();
  const { logout } = useAuthActions();
  const currentUser = useCurrentUserQuery();
  const notifications = useNotificationsQuery();
  const user = sessionUser ?? currentUser.data ?? null;
  const unreadCount = (notifications.data ?? []).filter((item) => !item.read).length;
  const navigation = React.useMemo(
    () =>
      user?.role === "admin"
        ? [...baseNavigation, { href: "/admin", label: "Admin", icon: Shield }]
        : baseNavigation,
    [user?.role],
  );

  const signInHref = `/sign-in?next=${encodeURIComponent(pathname)}`;

  const handleLogout = React.useCallback(() => {
    startLogoutTransition(async () => {
      try {
        await logout();
        toast.success("Signed out of WaveStream.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sign out right now.");
      }
    });
  }, [logout]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_hsla(195,92%,42%,0.12),transparent_28%),radial-gradient(circle_at_top_right,_hsla(44,92%,56%,0.14),transparent_26%),linear-gradient(180deg,var(--background),color-mix(in_hsl,var(--background),white_6%))] text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 pb-40 pt-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6 lg:pb-36">
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-400 text-white shadow-lg">
                    <Music4 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-tight">WaveStream</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Creator audio platform
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>

              <Separator className="my-5" />

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={active ? "default" : "ghost"}
                      className={cn("w-full justify-start rounded-2xl px-4 py-3", active ? "" : "text-muted-foreground")}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <Badge variant="soft">{queueLength > 0 ? "Queue ready" : "Queue empty"}</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  {queueLength > 0
                    ? `${queueLength} track${queueLength === 1 ? "" : "s"} in the persistent queue.`
                    : "Open a track and press play to build a queue that survives navigation."}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Featured creator</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Account aware
                  </p>
                </div>
                <WandSparkles className="h-5 w-5 text-primary" />
              </div>
              {user ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {isBooting ? (
                    <p className="text-sm text-muted-foreground">
                      Restoring your secure session and queue context.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sign in to unlock your queue, notifications, and creator analytics.
                      </p>
                      <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                        <Link href={signInHref}>
                          <LogOut className="h-4 w-4" />
                          Sign in
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <header className="sticky top-4 z-30 rounded-[2rem] border border-border/80 bg-card/80 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-400 text-white">
                  <Music4 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">WaveStream</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Creator audio platform
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button asChild variant="outline" size="icon" aria-label="Profile menu">
                  <Link href={user ? `/artist/${user.username}` : signInHref}>
                    <UserCircle2 className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className="rounded-full"
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </header>

          <main className="space-y-6">
            {children}
            <SiteCredits />
          </main>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Quick actions</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Fast access
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <Button asChild className="w-full justify-start rounded-2xl">
                  <Link href="/creator">
                    <Upload className="h-4 w-4" />
                    {isAuthenticated ? "Upload a track" : "Creator dashboard"}
                  </Link>
                </Button>
                {user?.role === "admin" ? (
                  <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      Open admin hub
                    </Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                  <Link href="/discover">
                    <Compass className="h-4 w-4" />
                    Browse trends
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Account</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {isBooting ? "Restoring session" : user ? "Signed in" : "Guest mode"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Open account menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                          {user ? user.displayName.slice(0, 2).toUpperCase() : "WS"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52">
                    <DropdownMenuLabel>
                      {user ? user.displayName : "WaveStream guest"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/artist/${user.username}`}>
                            <UserCircle2 className="mr-2 h-4 w-4" />
                            View profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          {isLoggingOut ? "Signing out..." : "Sign out"}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href={signInHref}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign in
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MiniPlayer />
    </div>
  );
}
