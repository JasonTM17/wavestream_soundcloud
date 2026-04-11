import {
  AdminActionType,
  NotificationType,
  ReportStatus,
  ReportableType,
  TrackPrivacy,
  TrackStatus,
  UserRole,
} from '@wavestream/shared';

export const DEMO_LISTENER_PASSWORD = 'DemoPass123!';

export interface SeedPalette {
  background: string;
  foreground: string;
  accent: string;
}

export interface SeedUserSpec {
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  bio: string;
  location: string;
  websiteUrl?: string;
  avatarPalette: SeedPalette;
  bannerPalette: SeedPalette;
}

export interface SeedTrackSpec {
  slug: string;
  artistUsername: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  privacy: TrackPrivacy;
  status: TrackStatus;
  allowDownloads: boolean;
  commentsEnabled: boolean;
  hiddenReason?: string;
  daysAgo: number;
  durationSeconds: number;
  baseFrequency: number;
  pulseFrequency: number;
  palette: SeedPalette;
}

export interface SeedPlaylistSpec {
  slug: string;
  ownerUsername: string;
  title: string;
  description: string;
  isPublic: boolean;
  trackSlugs: string[];
  daysAgo: number;
  palette: SeedPalette;
}

export interface SeedCommentSpec {
  key: string;
  username: string;
  trackSlug: string;
  body: string;
  timestampSeconds?: number;
  parentKey?: string;
  hidden?: boolean;
}

export interface SeedReportSpec {
  reporterUsername: string;
  reportableType: ReportableType;
  targetKey: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  resolvedByAdmin?: boolean;
  resolutionNote?: string;
}

export interface SeedAuditLogSpec {
  action: AdminActionType;
  entityType: string;
  entityKey: string;
  details?: Record<string, unknown>;
}

export interface SeedNotificationSpec {
  username: string;
  type: NotificationType;
  data: Record<string, unknown>;
}

export const SEED_GENRES = ['Electronic', 'Lo-fi', 'House', 'Ambient', 'Indie', 'Hip-Hop', 'R&B'];

export const SEED_USERS: SeedUserSpec[] = [
  {
    username: 'solis-kim',
    email: 'solis@wavestream.demo',
    displayName: 'Solis Kim',
    role: UserRole.CREATOR,
    bio: 'Builds nocturnal synth sketches for long train rides and coding sprints.',
    location: 'Bangkok, Thailand',
    websiteUrl: 'https://wavestream.demo/solis-kim',
    avatarPalette: {
      background: '#0b132b',
      foreground: '#f4f1de',
      accent: '#ff7b54',
    },
    bannerPalette: {
      background: '#102542',
      foreground: '#f8f9fa',
      accent: '#f87060',
    },
  },
  {
    username: 'aria-voss',
    email: 'aria@wavestream.demo',
    displayName: 'Aria Voss',
    role: UserRole.CREATOR,
    bio: 'Warm tape textures, sunrise guitar loops, and voice memo details.',
    location: 'Berlin, Germany',
    websiteUrl: 'https://wavestream.demo/aria-voss',
    avatarPalette: {
      background: '#14342b',
      foreground: '#fefae0',
      accent: '#f4a261',
    },
    bannerPalette: {
      background: '#1d3557',
      foreground: '#f1faee',
      accent: '#f4a261',
    },
  },
  {
    username: 'miko-lane',
    email: 'miko@wavestream.demo',
    displayName: 'Miko Lane',
    role: UserRole.CREATOR,
    bio: 'Club percussion, polished basslines, and quick-loop DJ ideas.',
    location: 'Ho Chi Minh City, Vietnam',
    websiteUrl: 'https://wavestream.demo/miko-lane',
    avatarPalette: {
      background: '#201e43',
      foreground: '#fff8e8',
      accent: '#f97316',
    },
    bannerPalette: {
      background: '#1b1f3b',
      foreground: '#f8edeb',
      accent: '#ffb703',
    },
  },
  {
    username: 'noa-river',
    email: 'noa@wavestream.demo',
    displayName: 'Noa River',
    role: UserRole.CREATOR,
    bio: 'Quiet ambient builds and low-end R&B demos with lots of negative space.',
    location: 'Seoul, South Korea',
    websiteUrl: 'https://wavestream.demo/noa-river',
    avatarPalette: {
      background: '#1f2937',
      foreground: '#f9fafb',
      accent: '#38bdf8',
    },
    bannerPalette: {
      background: '#0f172a',
      foreground: '#e2e8f0',
      accent: '#22d3ee',
    },
  },
  {
    username: 'luka-bayne',
    email: 'luka@wavestream.demo',
    displayName: 'Luka Bayne',
    role: UserRole.CREATOR,
    bio: 'Indie hooks, broken-drum experiments, and rough-cut vocal toplines.',
    location: 'Lisbon, Portugal',
    websiteUrl: 'https://wavestream.demo/luka-bayne',
    avatarPalette: {
      background: '#2d1e2f',
      foreground: '#f7f7ff',
      accent: '#ff9f1c',
    },
    bannerPalette: {
      background: '#2b2d42',
      foreground: '#edf2f4',
      accent: '#ef476f',
    },
  },
  {
    username: 'ivy-hart',
    email: 'ivy@wavestream.demo',
    displayName: 'Ivy Hart',
    role: UserRole.LISTENER,
    bio: 'Playlist-heavy listener who bookmarks every late-night loop.',
    location: 'Singapore',
    avatarPalette: {
      background: '#264653',
      foreground: '#f1faee',
      accent: '#e9c46a',
    },
    bannerPalette: {
      background: '#1d3557',
      foreground: '#f1faee',
      accent: '#a8dadc',
    },
  },
  {
    username: 'dev-patel',
    email: 'dev@wavestream.demo',
    displayName: 'Dev Patel',
    role: UserRole.LISTENER,
    bio: 'Finds mixes for commute mode and keeps a deep queue of reposts.',
    location: 'London, United Kingdom',
    avatarPalette: {
      background: '#0f4c5c',
      foreground: '#edf6f9',
      accent: '#ffb703',
    },
    bannerPalette: {
      background: '#023047',
      foreground: '#edf6f9',
      accent: '#fb8500',
    },
  },
  {
    username: 'mia-tran',
    email: 'mia@wavestream.demo',
    displayName: 'Mia Tran',
    role: UserRole.LISTENER,
    bio: 'Searches for polished demos and drops timestamped notes on every find.',
    location: 'Da Nang, Vietnam',
    avatarPalette: {
      background: '#283618',
      foreground: '#fefae0',
      accent: '#dda15e',
    },
    bannerPalette: {
      background: '#606c38',
      foreground: '#fefae0',
      accent: '#bc6c25',
    },
  },
  {
    username: 'theo-cross',
    email: 'theo@wavestream.demo',
    displayName: 'Theo Cross',
    role: UserRole.LISTENER,
    bio: 'Front-row fan for house and bass edits, especially unfinished ones.',
    location: 'Melbourne, Australia',
    avatarPalette: {
      background: '#14213d',
      foreground: '#fefae0',
      accent: '#fca311',
    },
    bannerPalette: {
      background: '#003049',
      foreground: '#fdf0d5',
      accent: '#f77f00',
    },
  },
  {
    username: 'jules-park',
    email: 'jules@wavestream.demo',
    displayName: 'Jules Park',
    role: UserRole.LISTENER,
    bio: 'Collects mellow instrumentals for design reviews and long edits.',
    location: 'Taipei, Taiwan',
    avatarPalette: {
      background: '#3a0ca3',
      foreground: '#f8f9fa',
      accent: '#4cc9f0',
    },
    bannerPalette: {
      background: '#480ca8',
      foreground: '#f8f9fa',
      accent: '#f72585',
    },
  },
];

export const SEED_TRACKS: SeedTrackSpec[] = [
  {
    slug: 'midnight-static',
    artistUsername: 'solis-kim',
    title: 'Midnight Static',
    description:
      'A glossy midnight driver with clipped drums, slow-bloom pads, and a patient low end.',
    genre: 'Electronic',
    tags: ['analog', 'night-drive', 'synth'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: true,
    commentsEnabled: true,
    daysAgo: 2,
    durationSeconds: 16,
    baseFrequency: 220,
    pulseFrequency: 2,
    palette: {
      background: '#0f172a',
      foreground: '#f8fafc',
      accent: '#fb7185',
    },
  },
  {
    slug: 'balcony-sunrise',
    artistUsername: 'aria-voss',
    title: 'Balcony Sunrise',
    description: 'Tape-soft chords and brushed drums made for slow starts and second coffees.',
    genre: 'Lo-fi',
    tags: ['morning', 'study', 'tape'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: true,
    commentsEnabled: true,
    daysAgo: 1,
    durationSeconds: 18,
    baseFrequency: 196,
    pulseFrequency: 2.5,
    palette: {
      background: '#1f2937',
      foreground: '#fef3c7',
      accent: '#fb923c',
    },
  },
  {
    slug: 'southbound-lights',
    artistUsername: 'miko-lane',
    title: 'Southbound Lights',
    description:
      'A clean house sketch with clipped vocal chops and a bassline that keeps leaning forward.',
    genre: 'House',
    tags: ['club', 'night', 'dj-tool'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: false,
    commentsEnabled: true,
    daysAgo: 5,
    durationSeconds: 14,
    baseFrequency: 247,
    pulseFrequency: 3.5,
    palette: {
      background: '#111827',
      foreground: '#ecfeff',
      accent: '#22d3ee',
    },
  },
  {
    slug: 'soft-signal',
    artistUsername: 'noa-river',
    title: 'Soft Signal',
    description:
      'Subtle ambient swells and patient top notes built to leave space around a voiceover.',
    genre: 'Ambient',
    tags: ['ambient', 'focus', 'drift'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: true,
    commentsEnabled: true,
    daysAgo: 7,
    durationSeconds: 20,
    baseFrequency: 164,
    pulseFrequency: 1.4,
    palette: {
      background: '#0f172a',
      foreground: '#e0f2fe',
      accent: '#38bdf8',
    },
  },
  {
    slug: 'afterimage',
    artistUsername: 'luka-bayne',
    title: 'Afterimage',
    description: 'An indie-pop scratch take with roomy drums and a chorus that lands immediately.',
    genre: 'Indie',
    tags: ['indie', 'hook', 'demo'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: false,
    commentsEnabled: true,
    daysAgo: 9,
    durationSeconds: 17,
    baseFrequency: 208,
    pulseFrequency: 2.2,
    palette: {
      background: '#1c1917',
      foreground: '#fafaf9',
      accent: '#fb7185',
    },
  },
  {
    slug: 'tape-bloom',
    artistUsername: 'solis-kim',
    title: 'Tape Bloom',
    description:
      'A dusty loop-led beat with warm kick weight and enough room for a top line later.',
    genre: 'Hip-Hop',
    tags: ['dusty', 'loop', 'beats'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: true,
    commentsEnabled: true,
    daysAgo: 4,
    durationSeconds: 15,
    baseFrequency: 180,
    pulseFrequency: 2.8,
    palette: {
      background: '#27272a',
      foreground: '#faf5ff',
      accent: '#f59e0b',
    },
  },
  {
    slug: 'open-water-demo',
    artistUsername: 'aria-voss',
    title: 'Open Water Demo',
    description: 'Unlisted ambient guitar wash shared for close listeners and playlist editors.',
    genre: 'Ambient',
    tags: ['unlisted', 'guitar', 'wash'],
    privacy: TrackPrivacy.UNLISTED,
    status: TrackStatus.PUBLISHED,
    allowDownloads: false,
    commentsEnabled: true,
    daysAgo: 6,
    durationSeconds: 19,
    baseFrequency: 174,
    pulseFrequency: 1.8,
    palette: {
      background: '#082f49',
      foreground: '#ecfeff',
      accent: '#67e8f9',
    },
  },
  {
    slug: 'private-draft-session',
    artistUsername: 'miko-lane',
    title: 'Private Draft Session',
    description: 'A rough private build with kick placement ideas and a placeholder drop section.',
    genre: 'House',
    tags: ['draft', 'private', 'work-in-progress'],
    privacy: TrackPrivacy.PRIVATE,
    status: TrackStatus.DRAFT,
    allowDownloads: false,
    commentsEnabled: false,
    daysAgo: 3,
    durationSeconds: 13,
    baseFrequency: 192,
    pulseFrequency: 4,
    palette: {
      background: '#172554',
      foreground: '#eff6ff',
      accent: '#60a5fa',
    },
  },
  {
    slug: 'echo-relay',
    artistUsername: 'noa-river',
    title: 'Echo Relay',
    description:
      'Low-key R&B textures, clipped percussion, and just enough vocal room for a topline.',
    genre: 'R&B',
    tags: ['rnb', 'late-night', 'smooth'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.PUBLISHED,
    allowDownloads: true,
    commentsEnabled: true,
    daysAgo: 8,
    durationSeconds: 18,
    baseFrequency: 156,
    pulseFrequency: 2.1,
    palette: {
      background: '#2e1065',
      foreground: '#faf5ff',
      accent: '#c084fc',
    },
  },
  {
    slug: 'neon-courtyard',
    artistUsername: 'luka-bayne',
    title: 'Neon Courtyard',
    description: 'A bright top-line demo currently hidden while metadata is under review.',
    genre: 'Electronic',
    tags: ['hidden', 'demo', 'topline'],
    privacy: TrackPrivacy.PUBLIC,
    status: TrackStatus.HIDDEN,
    allowDownloads: false,
    commentsEnabled: true,
    hiddenReason: 'Hidden by moderation pending metadata review.',
    daysAgo: 12,
    durationSeconds: 16,
    baseFrequency: 230,
    pulseFrequency: 3.2,
    palette: {
      background: '#172554',
      foreground: '#fdf4ff',
      accent: '#f472b6',
    },
  },
];

export const SEED_PLAYLISTS: SeedPlaylistSpec[] = [
  {
    slug: 'night-shift-warmup',
    ownerUsername: 'ivy-hart',
    title: 'Night Shift Warmup',
    description: 'Warm loops and low-light grooves for late design passes and one more deploy.',
    isPublic: true,
    trackSlugs: ['midnight-static', 'soft-signal', 'tape-bloom', 'echo-relay'],
    daysAgo: 1,
    palette: {
      background: '#111827',
      foreground: '#f9fafb',
      accent: '#fb7185',
    },
  },
  {
    slug: 'city-loop-reposts',
    ownerUsername: 'dev-patel',
    title: 'City Loop Reposts',
    description: 'The kind of repost chain that keeps a commute moving quickly.',
    isPublic: true,
    trackSlugs: ['midnight-static', 'southbound-lights', 'afterimage'],
    daysAgo: 2,
    palette: {
      background: '#0f172a',
      foreground: '#f8fafc',
      accent: '#38bdf8',
    },
  },
  {
    slug: 'sunday-edit-mode',
    ownerUsername: 'aria-voss',
    title: 'Sunday Edit Mode',
    description: 'My current folder of gentle textures, space, and a few near-finished ideas.',
    isPublic: true,
    trackSlugs: ['balcony-sunrise', 'soft-signal', 'afterimage', 'open-water-demo'],
    daysAgo: 4,
    palette: {
      background: '#1f2937',
      foreground: '#fefce8',
      accent: '#f59e0b',
    },
  },
  {
    slug: 'skyline-commute',
    ownerUsername: 'mia-tran',
    title: 'Skyline Commute',
    description: 'Fast starts, polished hooks, and a little lift before the inbox opens.',
    isPublic: true,
    trackSlugs: ['balcony-sunrise', 'southbound-lights', 'echo-relay'],
    daysAgo: 3,
    palette: {
      background: '#164e63',
      foreground: '#ecfeff',
      accent: '#67e8f9',
    },
  },
];

export const SEED_FOLLOWS: Array<[string, string]> = [
  ['ivy-hart', 'solis-kim'],
  ['ivy-hart', 'aria-voss'],
  ['dev-patel', 'miko-lane'],
  ['dev-patel', 'solis-kim'],
  ['mia-tran', 'aria-voss'],
  ['mia-tran', 'noa-river'],
  ['theo-cross', 'miko-lane'],
  ['theo-cross', 'luka-bayne'],
  ['jules-park', 'noa-river'],
  ['jules-park', 'solis-kim'],
  ['aria-voss', 'noa-river'],
  ['solis-kim', 'miko-lane'],
];

export const SEED_LIKES: Array<[string, string]> = [
  ['ivy-hart', 'midnight-static'],
  ['ivy-hart', 'soft-signal'],
  ['dev-patel', 'southbound-lights'],
  ['dev-patel', 'midnight-static'],
  ['mia-tran', 'balcony-sunrise'],
  ['mia-tran', 'echo-relay'],
  ['theo-cross', 'southbound-lights'],
  ['theo-cross', 'afterimage'],
  ['jules-park', 'soft-signal'],
  ['jules-park', 'balcony-sunrise'],
  ['aria-voss', 'soft-signal'],
  ['solis-kim', 'afterimage'],
];

export const SEED_REPOSTS: Array<[string, string]> = [
  ['ivy-hart', 'midnight-static'],
  ['dev-patel', 'southbound-lights'],
  ['mia-tran', 'balcony-sunrise'],
  ['theo-cross', 'southbound-lights'],
  ['jules-park', 'soft-signal'],
  ['aria-voss', 'echo-relay'],
];

export const SEED_COMMENTS: SeedCommentSpec[] = [
  {
    key: 'midnight-static-comment',
    username: 'ivy-hart',
    trackSlug: 'midnight-static',
    body: 'The bass bloom around 1:06 is perfect for late work sessions.',
    timestampSeconds: 66,
  },
  {
    key: 'midnight-static-reply',
    username: 'solis-kim',
    trackSlug: 'midnight-static',
    parentKey: 'midnight-static-comment',
    body: 'Love that spot too. It came from a cassette delay bounce.',
  },
  {
    key: 'balcony-sunrise-comment',
    username: 'mia-tran',
    trackSlug: 'balcony-sunrise',
    body: 'This feels like the exact first half-hour before the city wakes up.',
    timestampSeconds: 22,
  },
  {
    key: 'southbound-lights-comment',
    username: 'theo-cross',
    trackSlug: 'southbound-lights',
    body: 'Kick and bass are glued nicely. Would love a longer drop here.',
    timestampSeconds: 44,
  },
  {
    key: 'southbound-hidden-comment',
    username: 'theo-cross',
    trackSlug: 'southbound-lights',
    body: 'Removed by moderation after being flagged during demo seeding.',
    hidden: true,
  },
  {
    key: 'soft-signal-comment',
    username: 'jules-park',
    trackSlug: 'soft-signal',
    body: 'Instant focus soundtrack. The space in the top end is really clean.',
    timestampSeconds: 51,
  },
  {
    key: 'echo-relay-comment',
    username: 'dev-patel',
    trackSlug: 'echo-relay',
    body: 'Super smooth pocket. This would slide into a commute playlist immediately.',
    timestampSeconds: 37,
  },
];

export const SEED_REPORTS: SeedReportSpec[] = [
  {
    reporterUsername: 'mia-tran',
    reportableType: ReportableType.TRACK,
    targetKey: 'southbound-lights',
    reason: 'Potential metadata mismatch',
    details: 'The upload title and description look slightly out of sync.',
    status: ReportStatus.PENDING,
  },
  {
    reporterUsername: 'ivy-hart',
    reportableType: ReportableType.COMMENT,
    targetKey: 'southbound-hidden-comment',
    reason: 'Spam / low-signal comment',
    details: 'This comment looked like a throwaway placeholder.',
    status: ReportStatus.REVIEWED,
    resolvedByAdmin: true,
    resolutionNote: 'Confirmed and hidden by moderation.',
  },
  {
    reporterUsername: 'jules-park',
    reportableType: ReportableType.PLAYLIST,
    targetKey: 'city-loop-reposts',
    reason: 'Playlist description looks outdated',
    details: 'No harmful content, just checking moderation flow.',
    status: ReportStatus.DISMISSED,
    resolvedByAdmin: true,
    resolutionNote: 'Dismissed as non-actionable.',
  },
];

export const SEED_AUDIT_LOGS: SeedAuditLogSpec[] = [
  {
    action: AdminActionType.HIDE_TRACK,
    entityType: 'track',
    entityKey: 'neon-courtyard',
    details: {
      reason: 'Hidden by moderation pending metadata review.',
    },
  },
  {
    action: AdminActionType.HIDE_COMMENT,
    entityType: 'comment',
    entityKey: 'southbound-hidden-comment',
    details: {
      reason: 'Confirmed low-signal demo comment.',
    },
  },
];

export const SEED_NOTIFICATIONS: SeedNotificationSpec[] = [
  {
    username: 'solis-kim',
    type: NotificationType.FOLLOW,
    data: {
      username: 'ivy-hart',
      userId: 'ivy-hart',
    },
  },
  {
    username: 'aria-voss',
    type: NotificationType.LIKE,
    data: {
      username: 'mia-tran',
      trackSlug: 'balcony-sunrise',
    },
  },
  {
    username: 'miko-lane',
    type: NotificationType.REPOST,
    data: {
      username: 'dev-patel',
      trackSlug: 'southbound-lights',
    },
  },
  {
    username: 'noa-river',
    type: NotificationType.COMMENT,
    data: {
      username: 'jules-park',
      trackSlug: 'soft-signal',
    },
  },
  {
    username: 'ivy-hart',
    type: NotificationType.REPORT_UPDATE,
    data: {
      reportKey: 'southbound-hidden-comment',
      status: ReportStatus.REVIEWED,
    },
  },
];
