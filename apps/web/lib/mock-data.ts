export type TrackPreview = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  plays: string;
  cover: string;
  color: string;
};

export type ArtistPreview = {
  id: string;
  name: string;
  handle: string;
  bio: string;
  followers: string;
  avatar: string;
};

export type PlaylistPreview = {
  id: string;
  title: string;
  description: string;
  tracks: string;
  cover: string;
};

export const trendingTracks: TrackPreview[] = [
  {
    id: "night-drift",
    title: "Night Drift",
    artist: "Mira Vale",
    genre: "Electronic",
    duration: "4:18",
    plays: "1.2M",
    cover: "from-cyan-500 via-sky-500 to-indigo-500",
    color: "bg-cyan-500/15",
  },
  {
    id: "glass-house",
    title: "Glass House",
    artist: "Luma Coast",
    genre: "Indie Pop",
    duration: "3:42",
    plays: "842K",
    cover: "from-emerald-500 via-teal-500 to-sky-500",
    color: "bg-emerald-500/15",
  },
  {
    id: "signal-flare",
    title: "Signal Flare",
    artist: "Kairo Bloom",
    genre: "Alt R&B",
    duration: "2:57",
    plays: "620K",
    cover: "from-amber-400 via-orange-400 to-rose-400",
    color: "bg-amber-500/15",
  },
  {
    id: "afterimage",
    title: "Afterimage",
    artist: "Noa Circuit",
    genre: "Ambient",
    duration: "5:09",
    plays: "431K",
    cover: "from-slate-500 via-slate-700 to-slate-900",
    color: "bg-slate-500/15",
  },
];

export const featuredArtists: ArtistPreview[] = [
  {
    id: "mira-vale",
    name: "Mira Vale",
    handle: "@miravale",
    bio: "Producer blending nocturnal synths, cinematic textures, and glossy pop hooks.",
    followers: "218K",
    avatar: "MV",
  },
  {
    id: "kairo-bloom",
    name: "Kairo Bloom",
    handle: "@kairobloom",
    bio: "Writer-producer known for intimate vocals and polished rhythm-forward demos.",
    followers: "143K",
    avatar: "KB",
  },
  {
    id: "noa-circuit",
    name: "Noa Circuit",
    handle: "@noacircuit",
    bio: "Ambient architect creating expansive soundbeds and late-night listening sets.",
    followers: "97K",
    avatar: "NC",
  },
];

export const featuredPlaylists: PlaylistPreview[] = [
  {
    id: "midnight-loop",
    title: "Midnight Loop",
    description: "Soft-focus electronic cuts for long edits, night drives, and focused creation.",
    tracks: "24 tracks",
    cover: "from-slate-900 via-cyan-900 to-teal-700",
  },
  {
    id: "signal-boost",
    title: "Signal Boost",
    description: "Fresh uploads from rising creators with strong hooks and clean production.",
    tracks: "18 tracks",
    cover: "from-teal-500 via-cyan-500 to-indigo-500",
  },
  {
    id: "soft-focus",
    title: "Soft Focus",
    description: "Dreamy, understated, and tactile. Good headphones required.",
    tracks: "31 tracks",
    cover: "from-amber-300 via-rose-300 to-sky-300",
  },
];

export const discoveryTags = [
  "Trending",
  "New releases",
  "Electronic",
  "Indie",
  "Instrumental",
  "For you",
  "Creator reposts",
];

export const demoQueue = trendingTracks.slice(0, 3);
