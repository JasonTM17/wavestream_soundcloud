import { describe, expect, it } from 'vitest';

import { vi } from './vi';

describe('Vietnamese dictionary', () => {
  it('keeps primary navigation and player copy fully accented', () => {
    expect(vi.nav.searchPlaceholder).toBe('Tìm bài nhạc, nghệ sĩ, playlist...');
    expect(vi.nav.discover).toBe('Khám phá');
    expect(vi.nav.library).toBe('Thư viện');
    expect(vi.nav.upload).toBe('Tải lên');
    expect(vi.nav.signIn).toBe('Đăng nhập');
    expect(vi.player.selectTrack).toBe('Chọn một bài nhạc để phát');
    expect(vi.player.openPlayer).toBe('Mở trình phát');
    expect(vi.player.clearQueue).toBe('Xóa hàng chờ');
    expect(vi.player.removeFromQueue).toBe('Xóa khỏi hàng chờ');
    expect(vi.player.waveformSeek).toBe('Nhấn để tua');
    expect(vi.playlist.publicLabel).toBe('Công khai');
    expect(vi.artist.profileLabel).toBe('Hồ sơ nghệ sĩ');
    expect(vi.about.title).toBe('Giới thiệu');
    expect(vi.about.author).toBe('Nguyễn Sơn');
  });
});
