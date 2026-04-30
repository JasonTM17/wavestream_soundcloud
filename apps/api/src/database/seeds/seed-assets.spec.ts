import { createWaveAudioBuffer } from './seed-assets';

describe('seed audio assets', () => {
  it('creates deterministic stereo wav buffers', () => {
    const options = {
      durationSeconds: 30,
      baseFrequency: 208,
      pulseFrequency: 2.6,
      genre: 'Electronic',
      seed: 'aurora-current',
    };

    const first = createWaveAudioBuffer(options);
    const second = createWaveAudioBuffer(options);

    expect(first.equals(second)).toBe(true);
    expect(first.toString('ascii', 0, 4)).toBe('RIFF');
    expect(first.toString('ascii', 8, 12)).toBe('WAVE');
    expect(first.toString('ascii', 36, 40)).toBe('data');
    expect(first.readUInt16LE(22)).toBe(2);
    expect(first.readUInt16LE(34)).toBe(16);
    expect(first.readUInt32LE(24)).toBe(22_050);
    expect(first.readUInt16LE(32)).toBe(4);
    expect(first.byteLength).toBeGreaterThan(2_500_000);
  });

  it('writes non-silent audio samples into both channels', () => {
    const buffer = createWaveAudioBuffer({
      durationSeconds: 28,
      baseFrequency: 180,
      pulseFrequency: 2.2,
      genre: 'Lo-fi',
      seed: 'linen-hours',
    });

    const earlyFrame = 44 + 1_200 * 4;
    const firstLeftSample = buffer.readInt16LE(earlyFrame);
    const firstRightSample = buffer.readInt16LE(earlyFrame + 2);
    const midpoint = 44 + Math.floor(buffer.readUInt32LE(40) / 2 / 4) * 4;
    const midLeftSample = buffer.readInt16LE(midpoint);
    const midRightSample = buffer.readInt16LE(midpoint + 2);

    expect(Math.abs(firstLeftSample) + Math.abs(firstRightSample)).toBeGreaterThan(0);
    expect(Math.abs(midLeftSample) + Math.abs(midRightSample)).toBeGreaterThan(0);
    expect(midLeftSample).not.toBe(midRightSample);
  });

  it('changes musical texture by genre while staying deterministic', () => {
    const electronic = createWaveAudioBuffer({
      durationSeconds: 16,
      baseFrequency: 208,
      pulseFrequency: 2.6,
      genre: 'Electronic',
      seed: 'midnight-static',
    });
    const lofi = createWaveAudioBuffer({
      durationSeconds: 16,
      baseFrequency: 208,
      pulseFrequency: 2.6,
      genre: 'Lo-fi',
      seed: 'midnight-static',
    });

    expect(electronic.equals(lofi)).toBe(false);
  });
});
