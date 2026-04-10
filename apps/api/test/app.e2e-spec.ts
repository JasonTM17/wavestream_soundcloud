import request from 'supertest';
import { UserRole } from '@wavestream/shared';
import {
  createArtworkSvg,
  createWaveAudioBuffer,
} from 'src/database/seeds/seed-assets';
import { createTestApp, TestAppContext } from 'test/support/test-app.factory';

jest.mock(
  'music-metadata',
  () => ({
    parseBuffer: jest.fn().mockResolvedValue({
      format: {
        duration: 4,
      },
    }),
  }),
  { virtual: true },
);

const unwrap = <T>(response: request.Response) =>
  (response.body as { data: T }).data;

jest.setTimeout(30_000);

describe('WaveStream API (e2e)', () => {
  let context: TestAppContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    if (context) {
      await context.app.close();
      if (context.dataSource.isInitialized) {
        await context.dataSource.destroy();
      }
    }
  });

  const register = async (
    agent: ReturnType<typeof request.agent>,
    payload: {
      email: string;
      username: string;
      displayName: string;
      password: string;
    },
  ) => {
    const response = await agent
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    return unwrap<{
      user: { id: string; username: string; role: string };
      tokens: { accessToken: string };
    }>(response);
  };

  const login = async (
    agent: ReturnType<typeof request.agent>,
    payload: {
      email: string;
      password: string;
    },
  ) => {
    const response = await agent
      .post('/api/auth/login')
      .send(payload)
      .expect(200);

    return unwrap<{
      user: { id: string; username: string; role: string };
      tokens: { accessToken: string };
    }>(response);
  };

  it('supports register/login, upload, playback, social, playlist, and moderation flows', async () => {
    const server = context.app.getHttpServer() as Parameters<
      typeof request.agent
    >[0];
    const creatorAgent = request.agent(server);
    const listenerAgent = request.agent(server);
    const adminAgent = request.agent(server);

    const creatorRegistration = await register(creatorAgent, {
      email: 'creator@test.local',
      username: 'creator-alpha',
      displayName: 'Creator Alpha',
      password: 'Password123!',
    });
    const listenerRegistration = await register(listenerAgent, {
      email: 'listener@test.local',
      username: 'listener-bravo',
      displayName: 'Listener Bravo',
      password: 'Password123!',
    });
    const adminRegistration = await register(adminAgent, {
      email: 'admin-flow@test.local',
      username: 'admin-charlie',
      displayName: 'Admin Charlie',
      password: 'Password123!',
    });

    await context.usersRepository.update(
      { id: creatorRegistration.user.id },
      { role: UserRole.CREATOR },
    );
    await context.usersRepository.update(
      { id: listenerRegistration.user.id },
      { role: UserRole.LISTENER },
    );
    await context.usersRepository.update(
      { id: adminRegistration.user.id },
      { role: UserRole.ADMIN },
    );

    const creatorSession = await login(creatorAgent, {
      email: 'creator@test.local',
      password: 'Password123!',
    });
    const listenerSession = await login(listenerAgent, {
      email: 'listener@test.local',
      password: 'Password123!',
    });
    const adminSession = await login(adminAgent, {
      email: 'admin-flow@test.local',
      password: 'Password123!',
    });

    expect(adminSession.user.role).toBe(UserRole.ADMIN);

    const audioBuffer = createWaveAudioBuffer({
      durationSeconds: 4,
      baseFrequency: 220,
      pulseFrequency: 2,
    });
    const coverBuffer = createArtworkSvg({
      width: 512,
      height: 512,
      title: 'E2E Track',
      subtitle: 'Creator Alpha',
      palette: {
        background: '#111827',
        foreground: '#f9fafb',
        accent: '#38bdf8',
      },
      shapeSeed: 7,
    });

    const createTrackResponse = await creatorAgent
      .post('/api/tracks')
      .set('Authorization', `Bearer ${creatorSession.tokens.accessToken}`)
      .field('title', 'E2E Upload Track')
      .field('description', 'Integration upload flow for WaveStream')
      .field('genre', 'Electronic')
      .field('tags', 'e2e,upload')
      .field('allowDownloads', 'true')
      .field('commentsEnabled', 'true')
      .attach('audioFile', audioBuffer, {
        filename: 'track.wav',
        contentType: 'audio/wav',
      })
      .attach('coverImage', coverBuffer, {
        filename: 'cover.svg',
        contentType: 'image/svg+xml',
      })
      .expect(201);

    const createdTrack = unwrap<{
      id: string;
      title: string;
      artist: { id: string; username: string };
      playCount: number;
      likeCount: number;
      repostCount: number;
      commentCount: number;
    }>(createTrackResponse);

    expect(createdTrack.title).toBe('E2E Upload Track');

    await creatorAgent
      .patch(`/api/tracks/${createdTrack.id}`)
      .set('Authorization', `Bearer ${creatorSession.tokens.accessToken}`)
      .send({
        title: 'E2E Upload Track Updated',
        description: 'Updated by creator during integration test',
      })
      .expect(200);

    await listenerAgent
      .get(`/api/tracks/${createdTrack.id}/stream`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(200)
      .expect('Content-Type', /audio\/wav/);

    await listenerAgent
      .post(`/api/tracks/${createdTrack.id}/play`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .send({
        durationListened: 4,
        source: 'player',
      })
      .expect(200);

    await listenerAgent
      .post(`/api/tracks/${createdTrack.id}/like`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(201);

    await listenerAgent
      .post(`/api/tracks/${createdTrack.id}/repost`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(201);

    const commentResponse = await listenerAgent
      .post(`/api/tracks/${createdTrack.id}/comments`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .send({
        body: 'Love the low-end movement in this upload.',
        timestampSeconds: 2,
      })
      .expect(201);

    const comment = unwrap<{ id: string }>(commentResponse);

    await listenerAgent
      .post(`/api/users/${creatorRegistration.user.id}/follow`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(201);

    const playlistResponse = await listenerAgent
      .post('/api/playlists')
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .send({
        title: 'E2E Playlist',
        description: 'Covers playlist creation and add-track flow',
        isPublic: true,
      })
      .expect(201);

    const playlist = unwrap<{ id: string }>(playlistResponse);

    await listenerAgent
      .post(`/api/playlists/${playlist.id}/tracks`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .send({
        trackId: createdTrack.id,
      })
      .expect(201);

    const reportResponse = await listenerAgent
      .post('/api/reports')
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .send({
        reportableType: 'track',
        reportableId: createdTrack.id,
        reason: 'Checking moderation workflow',
        details: 'E2E moderation verification',
      })
      .expect(201);

    const report = unwrap<{ id: string; status: string }>(reportResponse);
    expect(report.status).toBe('pending');

    await adminAgent
      .patch(`/api/admin/reports/${report.id}/resolve`)
      .set('Authorization', `Bearer ${adminSession.tokens.accessToken}`)
      .send({
        status: 'reviewed',
        note: 'Validated via integration suite',
      })
      .expect(200);

    await adminAgent
      .patch(`/api/admin/comments/${comment.id}/hide`)
      .set('Authorization', `Bearer ${adminSession.tokens.accessToken}`)
      .send({
        reason: 'Moderation flow exercised in e2e',
      })
      .expect(200);

    const trackResponse = await listenerAgent
      .get(`/api/tracks/${createdTrack.id}`)
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(200);

    const updatedTrack = unwrap<{
      title: string;
      playCount: number;
      likeCount: number;
      repostCount: number;
      commentCount: number;
      isLiked: boolean;
      isReposted: boolean;
      isFollowingArtist: boolean;
    }>(trackResponse);

    expect(updatedTrack.title).toBe('E2E Upload Track Updated');
    expect(updatedTrack.playCount).toBe(1);
    expect(updatedTrack.likeCount).toBe(1);
    expect(updatedTrack.repostCount).toBe(1);
    expect(updatedTrack.commentCount).toBe(1);
    expect(updatedTrack.isLiked).toBe(true);
    expect(updatedTrack.isReposted).toBe(true);
    expect(updatedTrack.isFollowingArtist).toBe(true);

    const historyResponse = await listenerAgent
      .get('/api/tracks/me/history')
      .set('Authorization', `Bearer ${listenerSession.tokens.accessToken}`)
      .expect(200);

    const history = unwrap<Array<{ track: { id: string } }>>(historyResponse);
    expect(history[0]?.track.id).toBe(createdTrack.id);

    const dashboardResponse = await creatorAgent
      .get('/api/me/dashboard')
      .set('Authorization', `Bearer ${creatorSession.tokens.accessToken}`)
      .expect(200);

    const dashboard = unwrap<{
      totalPlays: number;
      totalLikes: number;
      totalReposts: number;
      totalComments: number;
    }>(dashboardResponse);
    expect(dashboard.totalPlays).toBe(1);
    expect(dashboard.totalLikes).toBe(1);
    expect(dashboard.totalReposts).toBe(1);
    expect(dashboard.totalComments).toBe(1);

    expect(context.notificationsGateway.emitToUser).toHaveBeenCalled();

    const notifications = await context.notificationsRepository.find();
    expect(notifications.length).toBeGreaterThanOrEqual(4);

    await creatorAgent
      .delete(`/api/tracks/${createdTrack.id}`)
      .set('Authorization', `Bearer ${creatorSession.tokens.accessToken}`)
      .expect(200);

    await listenerAgent.get(`/api/tracks/${createdTrack.id}`).expect(404);
  });

  it('rotates refresh tokens and clears the cookie on logout', async () => {
    const server = context.app.getHttpServer() as Parameters<
      typeof request.agent
    >[0];
    const agent = request.agent(server);

    const registration = await register(agent, {
      email: 'refresh@test.local',
      username: 'refresh-user',
      displayName: 'Refresh User',
      password: 'Password123!',
    });

    expect(registration.tokens.accessToken).toBeTruthy();

    const refreshResponse = await agent.post('/api/auth/refresh').expect(200);
    const refreshedSession = unwrap<{
      tokens: { accessToken: string };
      user: { username: string };
    }>(refreshResponse);

    expect(refreshedSession.tokens.accessToken).toBeTruthy();
    expect(refreshResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('wavestream_refresh_token='),
      ]),
    );

    const logoutResponse = await agent.post('/api/auth/logout').expect(200);
    expect(unwrap<{ loggedOut: boolean }>(logoutResponse)).toEqual({
      loggedOut: true,
    });
    expect(logoutResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('wavestream_refresh_token=;'),
      ]),
    );
  });
});
