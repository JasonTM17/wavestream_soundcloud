import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-themes', () => ({
  ThemeProvider: ({
    children,
    defaultTheme,
  }: {
    children: React.ReactNode;
    defaultTheme: string;
  }) => <div data-default-theme={defaultTheme}>{children}</div>,
}));

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

vi.mock('@/components/auth/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/player/player-provider', () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/i18n', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { Providers } from './providers';

describe('Providers', () => {
  it('defaults the anonymous app shell to the dark theme', () => {
    const { container } = render(<Providers>WaveStream child</Providers>);

    expect(screen.getByText('WaveStream child')).toBeVisible();
    expect(container.querySelector('[data-default-theme]')).toHaveAttribute(
      'data-default-theme',
      'dark',
    );
  });
});
