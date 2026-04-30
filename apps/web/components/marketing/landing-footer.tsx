'use client';

import Link from 'next/link';
import { Music4 } from 'lucide-react';

import { useT } from '@/lib/i18n';

export function LandingFooter() {
  const tCommon = useT('common');
  const tNav = useT('nav');

  return (
    <footer className="border-t border-border mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
            <Music4 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">WaveStream</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/discover" className="hover:text-foreground transition-colors">
            {tNav.discover}
          </Link>
          <Link href="/search" className="hover:text-foreground transition-colors">
            {tNav.search}
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            {tCommon.about}
          </Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            {tCommon.signIn}
          </Link>
        </div>
        <p>Portfolio · Nguyễn Sơn · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
