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

export const getValidatedEnv = (): AppEnvironment => {
  const frontendOrigins = getEnv('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
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
    minioAccessKey: getEnv('MINIO_ACCESS_KEY', 'wavestream'),
    minioSecretKey: getEnv('MINIO_SECRET_KEY', 'wavestream_secret'),
    minioUseSsl: getEnv('MINIO_USE_SSL', 'false') === 'true',
    minioPublicUrl: getEnv('MINIO_PUBLIC_URL', 'http://localhost:9000'),
    jwtAccessSecret: getEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-in-prod-32'),
    jwtRefreshSecret: getEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-in-prod-32'),
    jwtAccessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
    jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),
    frontendUrl: frontendOrigins[0] ?? 'http://localhost:3000',
    frontendOrigins,
    smtpHost: getEnv('SMTP_HOST', 'mailpit'),
    smtpPort: Number(getEnv('SMTP_PORT', '1025')),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpFrom: getEnv('SMTP_FROM', 'WaveStream <noreply@wavestream.local>'),
    adminEmail: getEnv('ADMIN_EMAIL', 'admin@wavestream.local'),
    adminPassword: getEnv('ADMIN_PASSWORD', 'Admin123!'),
    adminDisplayName: getEnv('ADMIN_DISPLAY_NAME', 'WaveStream Admin'),
    adminUsername: getEnv('ADMIN_USERNAME', 'wavestream-admin'),
    defaultCreatorRole: (process.env.DEFAULT_CREATOR_ROLE as UserRole) ?? UserRole.CREATOR,
  };
};
