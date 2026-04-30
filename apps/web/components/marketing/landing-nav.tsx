'use client';

import Link from 'next/link';
import { Music4 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/lib/i18n';
import { useT } from '@/lib/i18n';

export function LandingNav() {
  const tCommon = useT('common');
  const tNav = useT('nav');
  const tLanding = useT('landing');

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Music4 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">WaveStream</p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {tLanding.heroSubtitle.split('.')[0]}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden gap-1 lg:flex">
            <Link
              href="/discover"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tNav.discover}
            </Link>
            <Link
              href="/creator"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tCommon.creator}
            </Link>
            <Link
              href="/about"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tCommon.about}
            </Link>
          </div>
          <LanguageToggle />
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex rounded-full"
          >
            <Link href="/sign-in">{tCommon.signIn}</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/sign-up">{tLanding.startFree}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
