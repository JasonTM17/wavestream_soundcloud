"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PlayerProvider } from "@/components/player/player-provider";

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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
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
                    "rounded-2xl border border-border/80 bg-background/95 text-foreground shadow-[0_18px_50px_-28px_rgba(10,13,25,0.55)] backdrop-blur-xl",
                }}
              />
            </PlayerProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
