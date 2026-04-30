'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/components/auth/auth-provider';
import { PlayerProvider } from '@/components/player/player-provider';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: React.PropsWithChildren) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={180}>
            <AuthProvider>
              <PlayerProvider>
                {children}
                <Toaster
                  richColors
                  closeButton
                  position="bottom-right"
                  toastOptions={{
                    className:
                      'rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
                  }}
                />
              </PlayerProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'development' ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </I18nProvider>
    </QueryClientProvider>
  );
}
