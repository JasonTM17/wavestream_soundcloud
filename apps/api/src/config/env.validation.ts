import { UserRole } from '@wavestream/shared';

export interface AppEnvironment {
  nodeEnv: string;
  port: number;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  redisHost: string;
  redisPort: number;
  minioEndpoint: string;
  minioPort: number;
  minioAccessKey: string;
  minioSecretKey: string;
  minioUseSsl: boolean;
  minioPublicUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;
  frontendUrl: string;
  frontendOrigins: string[];
  allowLoopbackCors: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
  adminEmail: string;
  adminPassword: string;
  adminDisplayName: string;
  adminUsername: string;
  defaultCreatorRole: UserRole;
}

const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const weakSecretPattern =
  /(change-me|dev-.*secret|secret-change-me|admin123!?|demopass123!?|wavestream_secret|^wavestream$)/i;

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, '');
  }
};

const isLoopbackOrigin = (value: string) => {
  try {
    const url = new URL(value);
    return LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

const getBooleanEnv = (key: string, fallback: boolean) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

const assertStrongSecret = (key: string, value: string, requireStrongSecrets: boolean) => {
  if (!requireStrongSecrets) {
    return;
  }

  if (value.length < 32 || weakSecretPattern.test(value)) {
    throw new Error(`${key} must be at least 32 characters and cannot use a default value`);
  }
};

const assertNoDefaultCredential = (
  key: string,
  value: string,
  requireStrongSecrets: boolean,
  minLength = 12,
) => {
  if (!requireStrongSecrets) {
    return;
  }

  if (value.length < minLength || weakSecretPattern.test(value)) {
    throw new Error(`${key} must be changed for production deployments`);
  }
};

export const getValidatedEnv = (): AppEnvironment => {
  const frontendOrigins = getEnv('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const hasOnlyLoopbackFrontendOrigins =
    frontendOrigins.length > 0 && frontendOrigins.every(isLoopbackOrigin);
  const allowLoopbackCors = getBooleanEnv(
    'ALLOW_LOOPBACK_CORS',
    nodeEnv !== 'production' || hasOnlyLoopbackFrontendOrigins,
  );
  const allowWeakLocalSecrets =
    getBooleanEnv('ALLOW_WEAK_LOCAL_SECRETS', false) && hasOnlyLoopbackFrontendOrigins;
  const requireStrongSecrets =
    process.env.REQUIRE_STRONG_SECRETS === 'true' ||
    (nodeEnv === 'production' && !allowWeakLocalSecrets);
  const jwtAccessSecret = getEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-in-prod-32');
  const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-in-prod-32');
  const minioAccessKey = getEnv('MINIO_ACCESS_KEY', 'wavestream');
  const minioSecretKey = getEnv('MINIO_SECRET_KEY', 'wavestream_secret');
  const adminPassword = getEnv('ADMIN_PASSWORD', 'Admin123!');

  assertStrongSecret('JWT_ACCESS_SECRET', jwtAccessSecret, requireStrongSecrets);
  assertStrongSecret('JWT_REFRESH_SECRET', jwtRefreshSecret, requireStrongSecrets);
  assertNoDefaultCredential('MINIO_ACCESS_KEY', minioAccessKey, requireStrongSecrets, 8);
  assertNoDefaultCredential('MINIO_SECRET_KEY', minioSecretKey, requireStrongSecrets, 16);
  assertNoDefaultCredential('ADMIN_PASSWORD', adminPassword, requireStrongSecrets, 12);

  return {
    nodeEnv,
    port: Number(getEnv('PORT', '4000')),
    dbHost: getEnv('DB_HOST', 'localhost'),
    dbPort: Number(getEnv('DB_PORT', '5432')),
    dbUser: getEnv('DB_USER', 'wavestream'),
    dbPassword: getEnv('DB_PASSWORD', 'wavestream_secret'),
    dbName: getEnv('DB_NAME', 'wavestream'),
    redisHost: getEnv('REDIS_HOST', 'localhost'),
    redisPort: Number(getEnv('REDIS_PORT', '6379')),
    minioEndpoint: getEnv('MINIO_ENDPOINT', 'localhost'),
    minioPort: Number(getEnv('MINIO_PORT', '9000')),
    minioAccessKey,
    minioSecretKey,
    minioUseSsl: getEnv('MINIO_USE_SSL', 'false') === 'true',
    minioPublicUrl: getEnv('MINIO_PUBLIC_URL', 'http://localhost:9000'),
    jwtAccessSecret,
    jwtRefreshSecret,
    jwtAccessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
    jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
    frontendUrl: frontendOrigins[0] ?? 'http://localhost:3000',
    frontendOrigins,
    allowLoopbackCors,
    smtpHost: getEnv('SMTP_HOST', 'mailpit'),
    smtpPort: Number(getEnv('SMTP_PORT', '1025')),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpFrom: getEnv('SMTP_FROM', 'WaveStream <noreply@wavestream.local>'),
    adminEmail: getEnv('ADMIN_EMAIL', 'admin@wavestream.local'),
    adminPassword,
    adminDisplayName: getEnv('ADMIN_DISPLAY_NAME', 'WaveStream Admin'),
    adminUsername: getEnv('ADMIN_USERNAME', 'wavestream-admin'),
    defaultCreatorRole: (process.env.DEFAULT_CREATOR_ROLE as UserRole) ?? UserRole.CREATOR,
  };
};
