'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  ExternalLink,
  Github,
  Headphones,
  LayoutDashboard,
  Mail,
  Music4,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const stats = [
  { label: 'Frontend', value: 'Next.js 16' },
  { label: 'Backend', value: 'NestJS 11' },
  { label: 'Database', value: 'PostgreSQL' },
  { label: 'Infra', value: 'Docker-first' },
];

const stack = [
  {
    category: 'Frontend',
    icon: Code2,
    items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'Radix UI', 'Zustand'],
  },
  {
    category: 'Backend',
    icon: Server,
    items: ['NestJS 11', 'TypeORM', 'PostgreSQL 16', 'Redis 7', 'BullMQ', 'JWT / Passport'],
  },
  {
    category: 'Delivery',
    icon: LayoutDashboard,
    items: ['Docker Compose', 'MinIO', 'Mailpit', 'GitHub Actions', 'Playwright E2E', 'GHCR'],
  },
];

const copy = {
  en: {
    back: 'Back to discovery',
    badges: ['Portfolio project', 'Music platform', 'Full-stack monorepo'],
    eyebrow: 'WaveStream',
    title: 'A production-minded music streaming platform.',
    description:
      'WaveStream is a full-stack portfolio product built around the real listening flow: public discovery, search, persistent playback, playlists, creator publishing, social reactions, reporting, and admin moderation. The demo catalog streams generated WAV audio and artwork from object storage, so the app behaves like a working music product instead of a static mock.',
    explore: 'Explore the app',
    source: 'Source code',
    snapshot: 'Project snapshot',
    coversTitle: 'Product scope',
    covers: [
      {
        title: 'Listener experience',
        description:
          'Discovery, genre landing, search, queue controls, likes, reposts, comments, follows, and personal playlists.',
        icon: Headphones,
      },
      {
        title: 'Creator studio',
        description:
          'Track upload, metadata editing, publishing controls, creator dashboard, and analytics-oriented views.',
        icon: UploadCloud,
      },
      {
        title: 'Admin moderation',
        description:
          'Report review, hide and restore flows, user role management, audit logs, and protected admin routing.',
        icon: ShieldCheck,
      },
      {
        title: 'Release-minded platform',
        description:
          'JWT auth, refresh-cookie rotation, storage, background queues, Docker, CI, tests, and typed contracts.',
        icon: Workflow,
      },
    ],
    stackTitle: 'Technical stack',
    qualityTitle: 'Engineering quality',
    quality: [
      'Production builds for web, API, and shared package',
      'Unit tests, E2E tests, visual snapshots, and Docker smoke coverage',
      'Type-safe shared DTOs and frontend API normalization',
      'Protected routes and role-gated surfaces',
      'Public playlist privacy hardening for private and draft tracks',
      'Release checklist for secrets, storage, SMTP, backup, smoke test, and rollback',
    ],
    architectureTitle: 'Architecture',
    architecture: [
      [
        'apps/web',
        'Next.js frontend for landing, auth, app shell, player, creator, admin, discovery, search, playlist, track, artist, and about pages.',
      ],
      [
        'apps/api',
        'NestJS API for auth, tracks, playlists, search, discovery, reports, moderation, storage, queues, and health checks.',
      ],
      [
        'packages/shared',
        'Shared DTOs, enums, and contracts that keep frontend and backend behavior aligned.',
      ],
      [
        'docker-compose.yml',
        'Local production-like stack with PostgreSQL, Redis, MinIO, Mailpit, API, and web.',
      ],
    ],
    docsTitle: 'Documentation and release readiness',
    docs: [
      'README and Vietnamese README explain setup, demo accounts, scripts, and verification.',
      'Local run notes document loopback hosts, Docker-first setup, and Playwright production-style testing.',
      'Release checklist covers required env, weak-secret blocking, storage, SMTP, database backup, smoke tests, and rollback.',
      'GitHub About copy is kept in docs so the public app stays polished instead of looking like internal notes.',
    ],
    author: 'Nguyen Son',
    role: 'Full-stack developer',
    docsCta: 'Read project docs',
  },
  vi: {
    back: 'Quay lại khám phá',
    badges: ['Dự án portfolio', 'Nền tảng nghe nhạc', 'Full-stack monorepo'],
    eyebrow: 'WaveStream',
    title: 'Nền tảng streaming nhạc được xây dựng như một sản phẩm thật.',
    description:
      'WaveStream là dự án portfolio full-stack tập trung vào trải nghiệm nghe nhạc thực tế: khám phá công khai, tìm kiếm, player liên tục, playlist, đăng tải nhạc, tương tác xã hội, báo cáo nội dung và kiểm duyệt admin. Bộ demo stream file WAV và artwork được tạo hợp lệ từ object storage, nên ứng dụng vận hành như một sản phẩm âm nhạc thật thay vì một mock tĩnh.',
    explore: 'Khám phá ứng dụng',
    source: 'Mã nguồn',
    snapshot: 'Tổng quan dự án',
    coversTitle: 'Phạm vi sản phẩm',
    covers: [
      {
        title: 'Trải nghiệm người nghe',
        description:
          'Khám phá, trang thể loại, tìm kiếm, queue, like, repost, bình luận, theo dõi và playlist cá nhân.',
        icon: Headphones,
      },
      {
        title: 'Creator Studio',
        description:
          'Upload nhạc, chỉnh metadata, điều khiển xuất bản, dashboard creator và các góc nhìn thiên về analytics.',
        icon: UploadCloud,
      },
      {
        title: 'Kiểm duyệt admin',
        description:
          'Xem báo cáo, ẩn và khôi phục nội dung, quản lý vai trò, audit log và route bảo vệ theo quyền.',
        icon: ShieldCheck,
      },
      {
        title: 'Sẵn sàng cho release',
        description:
          'JWT auth, refresh-cookie rotation, storage, background queue, Docker, CI, test và contract typed.',
        icon: Workflow,
      },
    ],
    stackTitle: 'Stack công nghệ',
    qualityTitle: 'Chất lượng kỹ thuật',
    quality: [
      'Production build cho web, API và shared package',
      'Unit test, E2E test, visual snapshot và Docker smoke coverage',
      'DTO dùng chung có type rõ ràng và normalization API phía frontend',
      'Route bảo vệ và bề mặt theo vai trò',
      'Hardening quyền riêng tư cho public playlist chứa track private hoặc draft',
      'Release checklist cho secrets, storage, SMTP, backup, smoke test và rollback',
    ],
    architectureTitle: 'Kiến trúc',
    architecture: [
      [
        'apps/web',
        'Frontend Next.js cho landing, auth, app shell, player, creator, admin, discovery, search, playlist, track, artist và about.',
      ],
      [
        'apps/api',
        'API NestJS cho auth, tracks, playlists, search, discovery, reports, moderation, storage, queue và health check.',
      ],
      ['packages/shared', 'DTO, enum và contract dùng chung để frontend/backend luôn khớp nhau.'],
      [
        'docker-compose.yml',
        'Stack local gần production với PostgreSQL, Redis, MinIO, Mailpit, API và web.',
      ],
    ],
    docsTitle: 'Tài liệu và mức sẵn sàng release',
    docs: [
      'README và README tiếng Việt mô tả setup, tài khoản demo, scripts và các bước kiểm thử.',
      'Local run notes ghi rõ loopback host, Docker-first setup và cách test production-style bằng Playwright.',
      'Release checklist bao phủ env bắt buộc, chặn secret yếu, storage, SMTP, backup database, smoke test và rollback.',
      'GitHub About copy được giữ trong docs để giao diện public trông như sản phẩm, không giống ghi chú nội bộ.',
    ],
    author: 'Nguyễn Sơn',
    role: 'Full-stack developer',
    docsCta: 'Đọc tài liệu dự án',
  },
};

export function AboutContent() {
  const { locale } = useI18n();
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <Button
        variant="ghost"
        asChild
        className="w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </Button>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {t.badges.map((badge, index) => (
              <Badge key={badge} variant={index === 0 ? 'soft' : 'outline'}>
                {badge}
              </Badge>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Music4 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{t.eyebrow}</p>
                <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
                  {t.title}
                </h1>
              </div>
            </div>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">{t.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full">
              <Link href="/discover">
                <Radio className="h-4 w-4" />
                {t.explore}
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a
                href="https://github.com/JasonTM17/wavestream_soundcloud"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                {t.source}
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-bold text-foreground">{t.snapshot}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-md bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t.coversTitle}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {t.covers.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t.stackTitle}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stack.map(({ category, items, icon: Icon }) => (
            <article key={category} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{category}</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t.architectureTitle}</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {t.architecture.map(([path, description]) => (
              <div key={path} className="grid gap-2 p-4 sm:grid-cols-[10rem_1fr]">
                <code className="h-fit w-fit rounded-md bg-muted px-2 py-1 text-xs font-bold text-primary">
                  {path}
                </code>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{t.qualityTitle}</h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <ul className="space-y-3">
              {t.quality.map((signal) => (
                <li key={signal} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t.docsTitle}</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <ul className="space-y-3">
            {t.docs.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
            <a
              href="https://github.com/JasonTM17/wavestream_soundcloud#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              {t.docsCta}
            </a>
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <span className="text-lg font-bold">NS</span>
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{t.author}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href="https://github.com/JasonTM17" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href="mailto:jasonbmt06@gmail.com">
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
