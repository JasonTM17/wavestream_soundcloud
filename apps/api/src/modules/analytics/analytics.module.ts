import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayEventEntity } from 'src/database/entities/play-event.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { AnalyticsController } from 'src/modules/analytics/analytics.controller';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { TracksModule } from 'src/modules/tracks/tracks.module';

@Module({
  imports: [TracksModule, TypeOrmModule.forFeature([TrackEntity, PlayEventEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
