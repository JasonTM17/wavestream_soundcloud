import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import { DataType, newDb } from 'pg-mem';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import appConfig from 'src/config/app.config';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiResponseInterceptor } from 'src/common/interceptors/api-response.interceptor';
import { databaseEntities } from 'src/database/database.module';
import { NotificationEntity } from 'src/database/entities/notification.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { MailService } from 'src/mail/mail.service';
import { AdminModule } from 'src/modules/admin/admin.module';
import { AnalyticsModule } from 'src/modules/analytics/analytics.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { PlaylistsModule } from 'src/modules/playlists/playlists.module';
import { ReportsModule } from 'src/modules/reports/reports.module';
import { TracksModule } from 'src/modules/tracks/tracks.module';
import { UsersModule } from 'src/modules/users/users.module';
import { StorageModule } from 'src/storage/storage.module';
import { StorageService } from 'src/storage/storage.service';

class InMemoryStorageService {
  private readonly objects = new Map<
    string,
    { body: Buffer; contentType: string }
  >();

  upload(payload: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType: string;
  }) {
    this.objects.set(`${payload.bucket}/${payload.key}`, {
      body: payload.body,
      contentType: payload.contentType,
    });

    return `http://storage.test/${payload.bucket}/${payload.key}`;
  }

  getSignedDownloadUrl(bucket: string, key: string) {
    return `http://storage.test/${bucket}/${key}?download=1`;
  }

  getObject(payload: { bucket: string; key: string; range?: string }) {
    const object = this.objects.get(`${payload.bucket}/${payload.key}`);
    if (!object) {
      throw new Error('Seeded object not found');
    }

    let body = object.body;
    let contentRange: string | undefined;

    if (payload.range) {
      const match = payload.range.match(/bytes=(\d+)-(\d+)?/);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : object.body.length - 1;
        body = object.body.subarray(start, end + 1);
        contentRange = `bytes ${start}-${end}/${object.body.length}`;
      }
    }

    return {
      Body: Readable.from(body),
      ContentType: object.contentType,
      ContentLength: body.length,
      ContentRange: contentRange,
      AcceptRanges: 'bytes',
    };
  }

  deleteObject(bucket: string, key: string) {
    this.objects.delete(`${bucket}/${key}`);
  }
}

class FakeMailService {
  sendPasswordReset = jest.fn().mockResolvedValue(undefined);
}

class FakeNotificationsGateway {
  emitToUser = jest.fn();
}

const configureTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '4001';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USER = 'wavestream';
  process.env.DB_PASSWORD = 'wavestream_secret';
  process.env.DB_NAME = 'wavestream_test';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.MINIO_ENDPOINT = 'localhost';
  process.env.MINIO_PORT = '9000';
  process.env.MINIO_ACCESS_KEY = 'wavestream';
  process.env.MINIO_SECRET_KEY = 'wavestream_secret';
  process.env.MINIO_USE_SSL = 'false';
  process.env.MINIO_PUBLIC_URL = 'http://localhost:9000';
  process.env.JWT_ACCESS_SECRET =
    'test-access-secret-that-is-long-enough-123456';
  process.env.JWT_REFRESH_SECRET =
    'test-refresh-secret-that-is-long-enough-12345';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '1025';
  process.env.SMTP_FROM = 'WaveStream Test <noreply@test.local>';
  process.env.ADMIN_EMAIL = 'admin@test.local';
  process.env.ADMIN_PASSWORD = 'Admin123!';
  process.env.ADMIN_DISPLAY_NAME = 'Test Admin';
  process.env.ADMIN_USERNAME = 'test-admin';
  process.env.DEFAULT_CREATOR_ROLE = 'creator';
};

const createPgMemDataSource = () => {
  const database = newDb({ autoCreateForeignKeyIndices: true });

  database.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
      impure: true,
    });
  });
  database.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.uuid,
    implementation: () => randomUUID(),
    impure: true,
  });
  database.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => randomUUID(),
    impure: true,
  });
  database.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'wavestream_test',
  });
  database.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 16.0',
  });

  const dataSource = database.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: databaseEntities,
    synchronize: true,
    logging: false,
  } as DataSourceOptions) as unknown as DataSource;

  return dataSource.initialize();
};

export interface TestAppContext {
  app: INestApplication;
  dataSource: DataSource;
  usersRepository: Repository<UserEntity>;
  notificationsRepository: Repository<NotificationEntity>;
  storageService: InMemoryStorageService;
  mailService: FakeMailService;
  notificationsGateway: FakeNotificationsGateway;
}

export const createTestApp = async (): Promise<TestAppContext> => {
  configureTestEnvironment();

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig],
      }),
      TypeOrmModule.forRootAsync({
        useFactory: () => ({
          type: 'postgres',
          entities: databaseEntities,
          synchronize: true,
          logging: false,
        }),
        dataSourceFactory: () => createPgMemDataSource(),
      }),
      MailModule,
      StorageModule,
      NotificationsModule,
      AnalyticsModule,
      AuthModule,
      UsersModule,
      TracksModule,
      PlaylistsModule,
      ReportsModule,
      AdminModule,
    ],
    providers: [
      {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      },
      {
        provide: APP_GUARD,
        useClass: RolesGuard,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: ApiResponseInterceptor,
      },
    ],
  })
  class TestAppModule {}

  const storageService = new InMemoryStorageService();
  const mailService = new FakeMailService();
  const notificationsGateway = new FakeNotificationsGateway();

  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  })
    .overrideProvider(StorageService)
    .useValue(storageService)
    .overrideProvider(MailService)
    .useValue(mailService)
    .overrideProvider(NotificationsGateway)
    .useValue(notificationsGateway)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  const dataSource = moduleRef.get(DataSource);

  return {
    app,
    dataSource,
    usersRepository: dataSource.getRepository(UserEntity),
    notificationsRepository: dataSource.getRepository(NotificationEntity),
    storageService,
    mailService,
    notificationsGateway,
  };
};
