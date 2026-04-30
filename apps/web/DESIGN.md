# WaveStream Design System

## Direction

WaveStream uses a SoundCloud-inspired dark interface with a vivid orange action color. The app should feel like a working music product first: fast to scan, dense where lists matter, and expressive through cover art, waveforms, creator avatars, and playback state.

The UI is not Spotify green. Primary actions, selected filters, active playback, progress, and important interactive affordances use WaveStream orange. Neutral surfaces stay charcoal and restrained so audio artwork can carry most of the visual energy.

## Color Roles

- Background: `hsl(var(--background))`, near black.
- Surface: `hsl(var(--card))`, used for panels, dialogs, player, and repeated content.
- Muted surface: `hsl(var(--muted))`, used for compact field groups and quiet empty states.
- Border: `hsl(var(--border))`, low-contrast dividers and outlines.
- Primary: `hsl(var(--primary))`, WaveStream orange for CTAs, active controls, selected filters, and waveform highlights.
- Primary foreground: `hsl(var(--primary-foreground))`, text and icons on orange.
- Foreground: `hsl(var(--foreground))`, primary text.
- Muted foreground: `hsl(var(--muted-foreground))`, secondary text and metadata.
- Destructive: `hsl(var(--destructive))`, errors and dangerous actions.

Avoid hardcoded `text-black`, Spotify green, and one-off brand colors. Prefer semantic tokens so dialogs, admin, player, search, and creator tools stay visually aligned.

## Typography

- Use the app font stack from `globals.css`.
- Letter spacing stays normal by default. Do not add wide tracking except for tiny metadata where the existing component already does it.
- Hero-scale text belongs only on true landing hero areas. App pages, dialogs, sidebars, and admin tables should use compact headings.
- Body and labels should favor 12px to 16px, with 18px to 24px reserved for section titles and page headers.

## Shape And Density

- Buttons are pill-shaped because playback and audio actions benefit from fast touch targets.
- Cards and panels should stay at 8px radius or less unless the existing component requires a larger page-level container.
- Do not nest cards inside cards. Use full-width sections, lists, tables, and panels instead.
- Keep operational screens dense but readable: search results, admin tabs, creator forms, playlist lists, and track comments should scan quickly.

## Components

### Buttons

- Primary: orange background, primary foreground text, subtle orange shadow.
- Outline: transparent surface, token border, foreground text, stronger border on hover.
- Ghost: transparent by default, muted text, muted hover surface.
- Icon buttons use lucide icons when available and should include accessible labels or visible text.

### Player

- Playback controls use primary orange for the most important action.
- Mini-player and waveform state must be stable in height across desktop and mobile.
- Track titles, artist names, duration, buffering, and queue state should never overlap.

### Search

- `q` search runs global search across tracks, artists, playlists, and genres.
- `genre` search is a real track filter, not decorative. Genre chips should update `/search?genre=...` and show track results.
- Empty states should sound human and product-ready, not seeded-data/debug copy.

### Playlists

- Public playlist surfaces must only expose public, published tracks.
- Dialog icons and badges use semantic tokens. Avoid black-on-orange assumptions; use `primary-foreground`.
- After creating a playlist from the add-to-playlist flow, the selected track should be added immediately.

### Admin

- Pagination controls read the API meta shape `hasNext` and `hasPrev`, with compatibility for legacy aliases.
- Admin actions should invalidate affected user, track, playlist, discovery, and report queries.
- Destructive and moderation states use semantic warning/destructive colors, not ad hoc palettes.

## Responsive Rules

- Header actions, search filters, mini-player controls, auth shells, and admin tabs must be tested on mobile and desktop.
- Text must not overflow buttons, badges, or cards. Prefer wrapping, truncation, or responsive layout changes over shrinking with viewport-based font sizes.
- Fixed-format controls such as waveform rows, icon buttons, and counters need stable dimensions to prevent layout shift.

## Copy Tone

- Product copy should be clear, calm, and listener-facing.
- Avoid implementation terms like seeded data, endpoint, mock, fallback, or live data in visible UI.
- Empty states should explain the next meaningful action or what will appear there.
