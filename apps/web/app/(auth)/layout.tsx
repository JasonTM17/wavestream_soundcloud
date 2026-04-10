import { Suspense } from "react";
import Link from "next/link";
import { Music4, Sparkles } from "lucide-react";

import { AuthPageGuard } from "@/components/protected-route";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthPageGuard>
        <main className="min-h-screen px-4 py-6 lg:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 shadow-[0_30px_80px_-35px_rgba(10,13,25,0.45)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden flex-col justify-between bg-[radial-gradient(circle_at_top,_rgba(38,189,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(239,197,90,0.16),transparent_30%),linear-gradient(180deg,rgba(7,11,24,0.96),rgba(14,22,40,0.9))] p-8 text-white lg:flex">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
                  <Music4 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">WaveStream</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                    Creator audio platform
                  </p>
                </div>
              </Link>
              <ThemeToggle />
            </div>

            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Secure auth shell with placeholder-safe form logic
              </div>
              <h1 className="text-5xl font-semibold tracking-tight text-balance">
                Sign in or create an account without breaking the demo shell.
              </h1>
              <p className="text-lg leading-8 text-white/72">
                These auth pages are already wired to the future API contract, with strong
                validation and graceful fallback errors while the backend is still under
                construction.
              </p>
            </div>

            <p className="text-sm text-white/55">
              WaveStream is an original product concept. No SoundCloud branding, assets, or copy
              are used here.
            </p>
          </section>

          <section className="flex flex-col justify-center p-4 sm:p-6 lg:p-10">
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-400 text-white">
                    <Music4 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight">WaveStream</p>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Creator audio platform
                    </p>
                  </div>
                </Link>
                <ThemeToggle />
              </div>
              {children}
            </div>
          </section>
        </div>
        </main>
      </AuthPageGuard>
    </Suspense>
  );
}
