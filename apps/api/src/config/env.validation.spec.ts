import { getValidatedEnv } from './env.validation';

const originalEnv = process.env;

const resetEnv = () => {
  process.env = { ...originalEnv };
  delete process.env.ALLOW_LOOPBACK_CORS;
  delete process.env.ALLOW_WEAK_LOCAL_SECRETS;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.FRONTEND_URL;
  delete process.env.JWT_ACCESS_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  delete process.env.MINIO_ACCESS_KEY;
  delete process.env.MINIO_SECRET_KEY;
  delete process.env.NODE_ENV;
  delete process.env.REQUIRE_STRONG_SECRETS;
};

describe('getValidatedEnv', () => {
  beforeEach(resetEnv);

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows loopback CORS by default for local frontend origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'http://localhost:3000/,http://127.0.0.1:3101';
    process.env.ALLOW_WEAK_LOCAL_SECRETS = 'true';

    const env = getValidatedEnv();

    expect(env.frontendOrigins).toEqual(['http://localhost:3000', 'http://127.0.0.1:3101']);
    expect(env.allowLoopbackCors).toBe(true);
  });

  it('does not enable loopback CORS by default for hosted production origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://wavestream.example.com';
    process.env.JWT_ACCESS_SECRET = 'access-secret-for-production-tests-12345';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret-for-production-tests-12345';
    process.env.MINIO_ACCESS_KEY = 'production-storage-access';
    process.env.MINIO_SECRET_KEY = 'production-storage-secret-12345';
    process.env.ADMIN_PASSWORD = 'production-admin-password-12345';

    const env = getValidatedEnv();

    expect(env.frontendOrigins).toEqual(['https://wavestream.example.com']);
    expect(env.allowLoopbackCors).toBe(false);
  });

  it('honors an explicit loopback CORS override', () => {
    process.env.NODE_ENV = 'development';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.ALLOW_LOOPBACK_CORS = 'false';

    const env = getValidatedEnv();

    expect(env.allowLoopbackCors).toBe(false);
  });

  it('rejects default production secrets for hosted origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://wavestream.example.com';

    expect(() => getValidatedEnv()).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects default storage and admin credentials when JWT secrets are strong', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://wavestream.example.com';
    process.env.JWT_ACCESS_SECRET = 'access-secret-for-production-tests-12345';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret-for-production-tests-12345';

    expect(() => getValidatedEnv()).toThrow(/MINIO_ACCESS_KEY/);

    process.env.MINIO_ACCESS_KEY = 'production-storage-access';
    expect(() => getValidatedEnv()).toThrow(/MINIO_SECRET_KEY/);

    process.env.MINIO_SECRET_KEY = 'production-storage-secret-12345';
    expect(() => getValidatedEnv()).toThrow(/ADMIN_PASSWORD/);
  });
});
