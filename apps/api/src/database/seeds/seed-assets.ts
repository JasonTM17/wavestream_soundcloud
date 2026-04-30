import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AppEnvironment } from 'src/config/env.validation';

export const AUDIO_BUCKET = 'wavestream-audio';
export const IMAGE_BUCKET = 'wavestream-images';

interface ArtworkPalette {
  background: string;
  foreground: string;
  accent: string;
}

interface ArtworkOptions {
  width: number;
  height: number;
  title: string;
  subtitle: string;
  palette: ArtworkPalette;
  shapeSeed: number;
}

interface AudioOptions {
  durationSeconds: number;
  baseFrequency: number;
  pulseFrequency: number;
  genre?: string;
  seed?: string;
  title?: string;
}

interface MusicPreset {
  bpm: number;
  kick: number;
  snare: number;
  hats: number;
  bass: number;
  chords: number;
  lead: number;
  texture: number;
  swing: number;
  kickPattern: number[];
  snarePattern: number[];
  hatDivision: number;
  chordProgression: number[][];
  bassPattern: number[];
  melodyPattern: number[];
  tone: 'bright' | 'warm' | 'dusty' | 'smooth' | 'wide';
}

export const createSeedS3Client = (env: AppEnvironment) =>
  new S3Client({
    endpoint: `http${env.minioUseSsl ? 's' : ''}://${env.minioEndpoint}:${env.minioPort}`,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.minioAccessKey,
      secretAccessKey: env.minioSecretKey,
    },
  });

export const ensureSeedBucket = async (client: S3Client, bucket: string) => {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
};

export const uploadSeedAsset = async (
  client: S3Client,
  env: AppEnvironment,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
) => {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${env.minioPublicUrl}/${bucket}/${key}`;
};

export const createArtworkSvg = (options: ArtworkOptions) => {
  const wavePath = Array.from({ length: 7 }, (_value, index) => {
    const x = 30 + index * ((options.width - 60) / 6);
    const y =
      options.height * 0.54 + Math.sin((options.shapeSeed + index) * 0.9) * options.height * 0.14;

    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}" viewBox="0 0 ${options.width} ${options.height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${options.palette.background}" />
          <stop offset="100%" stop-color="${options.palette.accent}" />
        </linearGradient>
        <linearGradient id="wave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${options.palette.foreground}" />
          <stop offset="100%" stop-color="${options.palette.accent}" />
        </linearGradient>
      </defs>
      <rect width="${options.width}" height="${options.height}" rx="32" fill="url(#bg)" />
      <circle cx="${options.width * 0.82}" cy="${options.height * 0.24}" r="${options.width * 0.18}" fill="${options.palette.foreground}" fill-opacity="0.12" />
      <circle cx="${options.width * 0.18}" cy="${options.height * 0.78}" r="${options.width * 0.22}" fill="${options.palette.foreground}" fill-opacity="0.08" />
      <path d="${wavePath}" fill="none" stroke="url(#wave)" stroke-width="${Math.max(6, options.width * 0.02)}" stroke-linecap="round" />
      <text x="40" y="${options.height - 90}" fill="${options.palette.foreground}" font-size="${Math.max(22, options.width * 0.06)}" font-family="'Segoe UI', Arial, sans-serif" font-weight="700">${escapeXml(options.title)}</text>
      <text x="40" y="${options.height - 48}" fill="${options.palette.foreground}" fill-opacity="0.82" font-size="${Math.max(14, options.width * 0.03)}" font-family="'Segoe UI', Arial, sans-serif">${escapeXml(options.subtitle)}</text>
    </svg>
  `.trim();

  return Buffer.from(svg, 'utf8');
};

const normalizeGenreKey = (value?: string) =>
  (value ?? 'electronic')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const MUSIC_PRESETS: Record<string, MusicPreset> = {
  electronic: {
    bpm: 124,
    kick: 0.9,
    snare: 0.32,
    hats: 0.44,
    bass: 0.68,
    chords: 0.28,
    lead: 0.4,
    texture: 0.16,
    swing: 0.01,
    kickPattern: [0, 2],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 3, 7, 10],
      [-2, 3, 7, 12],
      [-5, 0, 3, 7],
      [-7, -2, 2, 7],
    ],
    bassPattern: [0, 0, -2, 0, -5, -5, -7, -5],
    melodyPattern: [12, 10, 7, 5, 3, 7, 10, 15],
    tone: 'bright',
  },
  house: {
    bpm: 126,
    kick: 0.95,
    snare: 0.42,
    hats: 0.5,
    bass: 0.72,
    chords: 0.24,
    lead: 0.28,
    texture: 0.1,
    swing: 0.018,
    kickPattern: [0, 1, 2, 3],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 4, 7, 11],
      [-2, 2, 7, 11],
      [-5, 0, 4, 9],
      [-7, -2, 2, 7],
    ],
    bassPattern: [0, 0, 7, 0, -5, -5, 7, -5],
    melodyPattern: [12, 11, 7, 4, 7, 11, 14, 16],
    tone: 'bright',
  },
  techno: {
    bpm: 132,
    kick: 1,
    snare: 0.25,
    hats: 0.52,
    bass: 0.78,
    chords: 0.14,
    lead: 0.26,
    texture: 0.2,
    swing: 0,
    kickPattern: [0, 1, 2, 3],
    snarePattern: [1, 3],
    hatDivision: 4,
    chordProgression: [
      [0, 3, 7],
      [-1, 2, 7],
      [-5, 0, 3],
      [-7, -2, 2],
    ],
    bassPattern: [0, 0, 0, -1, 0, 0, -5, -1],
    melodyPattern: [12, 7, 12, 15, 10, 7, 5, 3],
    tone: 'bright',
  },
  'drum-and-bass': {
    bpm: 172,
    kick: 0.86,
    snare: 0.7,
    hats: 0.62,
    bass: 0.82,
    chords: 0.18,
    lead: 0.32,
    texture: 0.16,
    swing: 0.006,
    kickPattern: [0, 2.5],
    snarePattern: [1, 3],
    hatDivision: 4,
    chordProgression: [
      [0, 3, 7, 10],
      [-5, 0, 3, 7],
      [-2, 2, 7, 10],
      [-7, -2, 2, 7],
    ],
    bassPattern: [0, 0, -12, 7, -5, -5, -12, -2],
    melodyPattern: [12, 15, 10, 7, 19, 15, 12, 10],
    tone: 'wide',
  },
  'future-bass': {
    bpm: 150,
    kick: 0.78,
    snare: 0.58,
    hats: 0.42,
    bass: 0.7,
    chords: 0.48,
    lead: 0.46,
    texture: 0.12,
    swing: 0.02,
    kickPattern: [0, 1.5, 2.75],
    snarePattern: [1, 3],
    hatDivision: 4,
    chordProgression: [
      [0, 4, 7, 11, 14],
      [-5, 0, 4, 7, 12],
      [-7, -2, 2, 7, 11],
      [-2, 2, 7, 9, 14],
    ],
    bassPattern: [0, 0, 7, 0, -5, -5, -7, -2],
    melodyPattern: [16, 14, 11, 9, 7, 11, 14, 19],
    tone: 'wide',
  },
  'lo-fi': {
    bpm: 82,
    kick: 0.58,
    snare: 0.38,
    hats: 0.24,
    bass: 0.46,
    chords: 0.52,
    lead: 0.22,
    texture: 0.22,
    swing: 0.055,
    kickPattern: [0, 2.5],
    snarePattern: [1.15, 3.1],
    hatDivision: 2,
    chordProgression: [
      [0, 3, 7, 10],
      [-5, -2, 3, 7],
      [-7, -3, 0, 5],
      [-2, 2, 5, 9],
    ],
    bassPattern: [0, 0, -5, -5, -7, -7, -2, -2],
    melodyPattern: [12, 10, 7, 5, 3, 5, 7, 10],
    tone: 'dusty',
  },
  'hip-hop': {
    bpm: 92,
    kick: 0.74,
    snare: 0.62,
    hats: 0.42,
    bass: 0.76,
    chords: 0.28,
    lead: 0.22,
    texture: 0.14,
    swing: 0.04,
    kickPattern: [0, 1.75, 2.5],
    snarePattern: [1, 3],
    hatDivision: 4,
    chordProgression: [
      [0, 3, 7],
      [-7, -3, 0],
      [-5, 0, 3],
      [-2, 2, 7],
    ],
    bassPattern: [0, 0, -12, 7, -5, -5, -7, -12],
    melodyPattern: [7, 10, 12, 10, 5, 7, 3, 0],
    tone: 'warm',
  },
  'r-and-b': {
    bpm: 78,
    kick: 0.5,
    snare: 0.44,
    hats: 0.24,
    bass: 0.54,
    chords: 0.58,
    lead: 0.3,
    texture: 0.1,
    swing: 0.036,
    kickPattern: [0, 2.4],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 4, 7, 11],
      [-3, 2, 5, 9],
      [-5, 0, 4, 7],
      [-7, -2, 2, 5],
    ],
    bassPattern: [0, 0, -3, -3, -5, -5, -7, -7],
    melodyPattern: [11, 9, 7, 4, 7, 9, 11, 14],
    tone: 'smooth',
  },
  jazz: {
    bpm: 104,
    kick: 0.38,
    snare: 0.34,
    hats: 0.34,
    bass: 0.48,
    chords: 0.6,
    lead: 0.34,
    texture: 0.08,
    swing: 0.065,
    kickPattern: [0, 2.7],
    snarePattern: [1.2, 3.25],
    hatDivision: 2,
    chordProgression: [
      [0, 4, 7, 10],
      [-5, -1, 2, 7],
      [-2, 2, 5, 9],
      [-7, -3, 0, 4],
    ],
    bassPattern: [0, 4, 7, 10, -5, -1, 2, 7],
    melodyPattern: [7, 10, 12, 14, 10, 7, 5, 4],
    tone: 'smooth',
  },
  soul: {
    bpm: 86,
    kick: 0.48,
    snare: 0.42,
    hats: 0.22,
    bass: 0.52,
    chords: 0.56,
    lead: 0.3,
    texture: 0.12,
    swing: 0.04,
    kickPattern: [0, 2.2],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 3, 7, 10],
      [-2, 2, 5, 9],
      [-5, 0, 3, 7],
      [-7, -3, 0, 5],
    ],
    bassPattern: [0, 0, -2, -2, -5, -5, -7, -7],
    melodyPattern: [10, 12, 15, 12, 7, 10, 5, 3],
    tone: 'warm',
  },
  ambient: {
    bpm: 68,
    kick: 0.12,
    snare: 0.04,
    hats: 0.08,
    bass: 0.26,
    chords: 0.7,
    lead: 0.18,
    texture: 0.28,
    swing: 0,
    kickPattern: [0],
    snarePattern: [3],
    hatDivision: 1,
    chordProgression: [
      [0, 7, 12, 14],
      [-5, 2, 7, 12],
      [-2, 5, 9, 14],
      [-7, 0, 5, 10],
    ],
    bassPattern: [0, 0, -5, -5, -2, -2, -7, -7],
    melodyPattern: [12, 14, 19, 17, 14, 12, 10, 7],
    tone: 'wide',
  },
  indie: {
    bpm: 112,
    kick: 0.56,
    snare: 0.48,
    hats: 0.28,
    bass: 0.5,
    chords: 0.4,
    lead: 0.36,
    texture: 0.1,
    swing: 0.018,
    kickPattern: [0, 2],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 4, 7],
      [-7, -3, 0],
      [-5, 0, 4],
      [-2, 2, 7],
    ],
    bassPattern: [0, 0, -7, -7, -5, -5, -2, -2],
    melodyPattern: [12, 11, 9, 7, 4, 7, 9, 12],
    tone: 'warm',
  },
  pop: {
    bpm: 118,
    kick: 0.64,
    snare: 0.5,
    hats: 0.34,
    bass: 0.54,
    chords: 0.38,
    lead: 0.48,
    texture: 0.08,
    swing: 0.01,
    kickPattern: [0, 2],
    snarePattern: [1, 3],
    hatDivision: 2,
    chordProgression: [
      [0, 4, 7],
      [-5, 0, 4],
      [-7, -3, 0],
      [-2, 2, 7],
    ],
    bassPattern: [0, 0, -5, -5, -7, -7, -2, -2],
    melodyPattern: [12, 14, 16, 14, 11, 9, 7, 11],
    tone: 'bright',
  },
  experimental: {
    bpm: 108,
    kick: 0.44,
    snare: 0.28,
    hats: 0.28,
    bass: 0.5,
    chords: 0.36,
    lead: 0.44,
    texture: 0.26,
    swing: 0.025,
    kickPattern: [0, 1.5, 3.25],
    snarePattern: [1.25, 2.75],
    hatDivision: 3,
    chordProgression: [
      [0, 1, 7, 10],
      [-6, -1, 3, 8],
      [-2, 4, 6, 11],
      [-9, -3, 2, 5],
    ],
    bassPattern: [0, -6, 1, -2, -9, 4, -3, 6],
    melodyPattern: [13, 6, 18, 10, 1, 15, 8, 20],
    tone: 'wide',
  },
};

const DEFAULT_MUSIC_PRESET = MUSIC_PRESETS.electronic;

const getMusicPreset = (genre?: string) => {
  const key = normalizeGenreKey(genre);
  return MUSIC_PRESETS[key] ?? DEFAULT_MUSIC_PRESET;
};

const hashSeed = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const semitoneToFrequency = (rootFrequency: number, semitone: number) =>
  rootFrequency * 2 ** (semitone / 12);

const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

const hitDistanceSeconds = (beat: number, pattern: number[], secondsPerBeat: number) => {
  let nearest = Number.POSITIVE_INFINITY;
  for (const patternBeat of pattern) {
    const beatDistance = modulo(beat - patternBeat, 4);
    nearest = Math.min(nearest, beatDistance * secondsPerBeat);
  }

  return nearest;
};

const triangle = (phase: number) => (2 / Math.PI) * Math.asin(Math.sin(phase));

const toneOscillator = (phase: number, tone: MusicPreset['tone']) => {
  switch (tone) {
    case 'bright':
      return Math.sin(phase) * 0.72 + Math.sin(phase * 2) * 0.2 + Math.sin(phase * 3) * 0.08;
    case 'dusty':
      return triangle(phase) * 0.82 + Math.sin(phase * 2 + 0.35) * 0.1;
    case 'smooth':
      return Math.sin(phase) * 0.9 + Math.sin(phase * 2 + 0.2) * 0.08;
    case 'wide':
      return Math.sin(phase) * 0.62 + triangle(phase * 0.5) * 0.28;
    case 'warm':
    default:
      return Math.sin(phase) * 0.78 + Math.sin(phase * 2) * 0.14 + Math.sin(phase * 3) * 0.04;
  }
};

const softClip = (value: number) => {
  const limited = Math.tanh(value * 1.28);
  return Math.max(-1, Math.min(1, limited * 0.96));
};

export const createWaveAudioBuffer = (options: AudioOptions) => {
  const sampleRate = 22_050;
  const channelCount = 2;
  const bitsPerSample = 16;
  const totalSamples = sampleRate * options.durationSeconds;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = totalSamples * channelCount * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
  buffer.writeUInt16LE(channelCount * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  const smoothStep = (edge0: number, edge1: number, value: number) => {
    if (edge0 === edge1) {
      return value >= edge1 ? 1 : 0;
    }

    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  const preset = getMusicPreset(options.genre);
  const seed = hashSeed(`${options.seed ?? options.title ?? 'seed'}:${options.genre ?? ''}`);
  const secondsPerBeat = 60 / preset.bpm;
  const rootFrequency = Math.max(72, options.baseFrequency);
  const swingOffset = preset.swing * (1 + (seed % 7) / 18);
  const twoPi = Math.PI * 2;
  let noiseState = seed || 1;
  let cachedBarIndex = -1;
  let cachedEighthIndex = -1;
  let cachedSixteenthIndex = -1;
  let chordFrequencies = [rootFrequency];
  let bassFrequency = rootFrequency / 2;
  let leadFrequency = rootFrequency * 2;

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(0.9, Math.max(0.4, options.durationSeconds * 0.025));
    const release = Math.min(1.2, Math.max(0.55, options.durationSeconds * 0.035));
    const intro = smoothStep(0, attack, time);
    const outro = smoothStep(0, release, options.durationSeconds - time);
    const envelope = intro * outro;

    const progress = time / options.durationSeconds;
    const arrangement = {
      drums: smoothStep(0.04, 0.16, progress) * smoothStep(1, 0.92, progress),
      bass: smoothStep(0.12, 0.24, progress) * smoothStep(1, 0.9, progress),
      lead: smoothStep(0.24, 0.36, progress) * smoothStep(1, 0.86, progress),
      full: smoothStep(0.32, 0.44, progress),
    };
    const swungTime =
      time + (Math.floor((time / secondsPerBeat) * 2) % 2 === 1 ? swingOffset * secondsPerBeat : 0);
    const beat = swungTime / secondsPerBeat;
    const barIndex = Math.floor(beat / 4);
    const sixteenthIndex = Math.floor(beat * 4);
    const eighthIndex = Math.floor(beat * 2);

    if (barIndex !== cachedBarIndex) {
      cachedBarIndex = barIndex;
      const chord = preset.chordProgression[barIndex % preset.chordProgression.length] ?? [0, 3, 7];
      chordFrequencies = chord
        .slice(0, 4)
        .map((semitone) => semitoneToFrequency(rootFrequency, semitone));
    }

    if (eighthIndex !== cachedEighthIndex) {
      cachedEighthIndex = eighthIndex;
      const bassSemitone = preset.bassPattern[eighthIndex % preset.bassPattern.length] ?? 0;
      bassFrequency = semitoneToFrequency(rootFrequency / 2, bassSemitone);
    }

    if (sixteenthIndex !== cachedSixteenthIndex) {
      cachedSixteenthIndex = sixteenthIndex;
      const melodySemitone =
        preset.melodyPattern[
          (sixteenthIndex + (seed % preset.melodyPattern.length)) % preset.melodyPattern.length
        ] ?? 12;
      leadFrequency = semitoneToFrequency(rootFrequency * 2, melodySemitone);
    }

    const stepGate = Math.sin(Math.PI * modulo(beat * 2, 1));
    const leadGate = Math.sin(Math.PI * modulo(beat * 4, 1));
    const sidechain = 0.76 + 0.24 * Math.sin(Math.PI * modulo(beat, 1));
    const drift = Math.sin(twoPi * (rootFrequency / 120) * time + (seed % 13)) * 0.015;
    noiseState = Math.imul(noiseState, 1664525) + 1013904223;
    const noise = ((noiseState >>> 0) / 0xffffffff) * 2 - 1;

    const chordLayer = chordFrequencies.reduce((sum, frequency, chordIndex) => {
      const phase = twoPi * frequency * (1 + drift * 0.5) * time + chordIndex * 0.37;
      return sum + toneOscillator(phase, preset.tone) / chordFrequencies.length;
    }, 0);

    const bassPhase = twoPi * bassFrequency * (1 + drift * 0.35) * time;
    const bass =
      (Math.sin(bassPhase) * 0.75 + Math.sin(bassPhase * 2) * 0.12) *
      Math.max(0.2, stepGate) *
      preset.bass *
      arrangement.bass;

    const leadPhase = twoPi * leadFrequency * (1 + drift * 0.18) * time + (seed % 31) * 0.03;
    const lead =
      toneOscillator(leadPhase, preset.tone) *
      Math.max(0, leadGate) *
      preset.lead *
      arrangement.lead;

    const kickDistance = hitDistanceSeconds(beat, preset.kickPattern, secondsPerBeat);
    const kickEnvelope = kickDistance < 0.26 ? Math.exp(-kickDistance * 18) : 0;
    const kick =
      Math.sin(twoPi * (48 + kickEnvelope * 78) * kickDistance) *
      kickEnvelope *
      preset.kick *
      arrangement.drums;

    const snareDistance = hitDistanceSeconds(beat, preset.snarePattern, secondsPerBeat);
    const snareEnvelope = snareDistance < 0.18 ? Math.exp(-snareDistance * 22) : 0;
    const snare =
      (noise * 0.7 + Math.sin(twoPi * 190 * snareDistance) * 0.25) *
      snareEnvelope *
      preset.snare *
      arrangement.drums;

    const hatBeat = beat * preset.hatDivision;
    const hatPhase = modulo(hatBeat, 1);
    const hatEnvelope = hatPhase < 0.32 ? Math.exp(-hatPhase * 11) : 0;
    const hats =
      noise *
      hatEnvelope *
      preset.hats *
      arrangement.drums *
      (0.72 + 0.28 * ((Math.floor(hatBeat) + seed) % 3 === 0 ? 1 : 0.55));

    const texture =
      (Math.sin(twoPi * (rootFrequency * 0.125) * time + 0.4) +
        Math.sin(twoPi * (rootFrequency * 0.0625) * time + 1.8) +
        noise * 0.1) *
      preset.texture *
      (0.55 + arrangement.full * 0.45);

    const pulseLfo = 0.84 + 0.12 * Math.sin(twoPi * options.pulseFrequency * 0.25 * time);
    const musicalBody =
      chordLayer * preset.chords * sidechain +
      bass +
      lead +
      texture +
      kick * 0.85 +
      snare * 0.55 +
      hats * 0.34;
    const stereoWidth =
      chordLayer * 0.12 + lead * 0.18 * Math.sin(twoPi * 0.13 * time + (seed % 5)) + texture * 0.2;
    const mixLeft = softClip((musicalBody + stereoWidth) * envelope * pulseLfo);
    const mixRight = softClip((musicalBody - stereoWidth) * envelope * (pulseLfo * 0.98));
    const frameOffset = 44 + index * channelCount * bytesPerSample;

    buffer.writeInt16LE(Math.round(clamp(mixLeft) * 0x7fff), frameOffset);
    buffer.writeInt16LE(Math.round(clamp(mixRight) * 0x7fff), frameOffset + bytesPerSample);
  }

  return buffer;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
