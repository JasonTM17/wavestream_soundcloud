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

export const createWaveAudioBuffer = (options: AudioOptions) => {
  const sampleRate = 44_100;
  const channelCount = 1;
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

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.min(1, time / 0.6) * Math.min(1, (options.durationSeconds - time) / 0.8);
    const base = Math.sin(2 * Math.PI * options.baseFrequency * time);
    const harmony = Math.sin(2 * Math.PI * (options.baseFrequency * 1.5) * time);
    const pulse = Math.sin(2 * Math.PI * options.pulseFrequency * time);
    const sample = (base * 0.58 + harmony * 0.24 + pulse * 0.18) * envelope;
    const clamped = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(clamped * 0x7fff), 44 + index * 2);
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
