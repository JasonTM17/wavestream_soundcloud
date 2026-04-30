'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Compass,
  BellRing,
  LibraryBig,
  LogIn,
  LogOut,
  Info,
  Music4,
  Search,
  Upload,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthActions, useAuthSession } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { MiniPlayer } from '@/components/player/mini-player';
import { LanguageToggle, useT } from '@/lib/i18n';
import { useCurrentUserQuery, useNotificationsQuery } from '@/lib/wavestream-queries';
import { cn } from '@/lib/utils';

export function AppShell({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [mountedPathname, setMountedPathname] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoggingOut, startLogoutTransition] = React.useTransition();
  const { isBooting, user: sessionUser } = useAuthSession();
  const { logout } = useAuthActions();
  const currentUser = useCurrentUserQuery();
  const notifications = useNotificationsQuery();
  const t = useT('nav');
  const tCommon = useT('common');
  const tAuth = useT('auth');
  const user = sessionUser ?? currentUser.data ?? null;
  const unreadCount = (notifications.data ?? []).filter((item) => !item.read).length;
  const activePathname = mountedPathname ?? '';

  React.useEffect(() => {
    setMountedPathname(pathname);
  }, [pathname]);

  const navigation = React.useMemo(
    () => [
      { href: '/discover', labelKey: 'discover' as const, icon: Compass },
      { href: '/search', labelKey: 'search' as const, icon: Search },
      { href: '/library', labelKey: 'library' as const, icon: LibraryBig },
      { href: '/creator', labelKey: 'upload' as const, icon: Upload },
      ...(user?.role === 'admin'
        ? [{ href: '/admin', labelKey: 'admin' as const, icon: Shield }]
        : []),
    ],
    [user?.role],
  );

  const signInHref = `/sign-in?next=${encodeURIComponent(activePathname || '/discover')}`;

  const handleLogout = React.useCallback(() => {
    startLogoutTransition(async () => {
      try {
        await logout();
        toast.success(tAuth.signOutCleared);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tCommon.somethingWentWrong);
      }
    });
  }, [logout, tAuth.signOutCleared, tCommon.somethingWentWrong]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="z-40 flex min-h-[60px] shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2 md:h-[60px] md:flex-nowrap md:gap-3 md:px-4 md:py-0">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 md:mr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Music4 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="hidden font-bold text-foreground sm:block tracking-tight">
            WaveStream
          </span>
        </Link>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="order-3 min-w-0 basis-full sm:order-none sm:basis-auto sm:flex-1 md:max-w-[420px]"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 rounded-full bg-muted border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </form>

        {/* Nav links — Desktop */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          {navigation.map((item) => {
            const active =
              activePathname === item.href || activePathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t[item.labelKey]}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: notifications + language + theme + user */}
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1">
              <BellRing className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">{unreadCount}</span>
            </div>
          )}
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9"
                  aria-label={t.accountMenu}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {user.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52">
                <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/artist/${user.username}`}>
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    {t.viewProfile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/about">
                    <Info className="mr-2 h-4 w-4" />
                    {tCommon.about}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? '...' : t.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isBooting ? null : (
            <Button asChild size="sm" className="h-9 rounded-full px-3">
              <Link href={signInHref}>
                <LogIn className="h-4 w-4" />
                {t.signIn}
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile nav pills */}
      <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
        {navigation.map((item) => {
          const active = activePathname === item.href || activePathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t[item.labelKey]}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] p-4 pb-24 lg:p-6 lg:pb-28">{children}</div>
      </main>

      {/* Bottom player bar */}
      <MiniPlayer />
    </div>
  );
}
