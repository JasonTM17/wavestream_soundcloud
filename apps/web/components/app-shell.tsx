"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LibraryBig,
  LogOut,
  Music4,
  Search,
  Sparkles,
  Upload,
  UserCircle2,
  WandSparkles,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { MiniPlayer } from "@/components/player/mini-player";
import { demoQueue, featuredArtists } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/creator", label: "Creator", icon: Upload },
];

export function AppShell({ children }: React.PropsWithChildren) {
  const pathname = usePathname();

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
                <Badge variant="soft">Queue ready</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  {demoQueue.length} demo tracks loaded, with playback state preserved across route changes.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Featured creator</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    This week
                  </p>
                </div>
                <WandSparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-sky-600 text-white">
                    {featuredArtists[0]?.avatar ?? "WS"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{featuredArtists[0]?.name}</p>
                  <p className="text-sm text-muted-foreground">{featuredArtists[0]?.handle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Intimate synth pop with polished hooks and creator-first release tools.
              </p>
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
                <Button variant="outline" size="icon" aria-label="Profile menu">
                  <UserCircle2 className="h-4 w-4" />
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

          <main className="space-y-6">{children}</main>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-[2rem] border border-border/80 bg-card/85 p-5 shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Quick actions</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Demo shell
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-4 space-y-2">
                <Button asChild className="w-full justify-start rounded-2xl">
                  <Link href="/creator">
                    <Upload className="h-4 w-4" />
                    Upload a track
                  </Link>
                </Button>
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
                    Placeholder-safe
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Open account menu">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                          WS
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52">
                    <DropdownMenuLabel>WaveStream demo</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/sign-in">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign in
                      </Link>
                    </DropdownMenuItem>
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
