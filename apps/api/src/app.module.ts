import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import appConfig from 'src/config/app.config';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiResponseInterceptor } from 'src/common/interceptors/api-response.interceptor';
import { DatabaseModule } from 'src/database/database.module';
import { MailModule } from 'src/mail/mail.module';
import { AnalyticsModule } from 'src/modules/analytics/analytics.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { DiscoveryModule } from 'src/modules/discovery/discovery.module';
import { HealthModule } from 'src/modules/health/health.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { PlaylistsModule } from 'src/modules/playlists/playlists.module';
import { TracksModule } from 'src/modules/tracks/tracks.module';
import { UsersModule } from 'src/modules/users/users.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    StorageModule,
    MailModule,
    HealthModule,
    AnalyticsModule,
    AuthModule,
    DiscoveryModule,
    NotificationsModule,
    PlaylistsModule,
    TracksModule,
    UsersModule,
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
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
