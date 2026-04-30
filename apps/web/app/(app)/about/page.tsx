import type { Metadata } from 'next';

import { AboutContent } from './about-content';

export const metadata: Metadata = {
  title: 'About WaveStream',
  description:
    'WaveStream is a full-stack SoundCloud-inspired portfolio project built with Next.js, NestJS, PostgreSQL, Redis, MinIO, Docker, and CI/CD.',
};

export default function AboutPage() {
  return <AboutContent />;
}
