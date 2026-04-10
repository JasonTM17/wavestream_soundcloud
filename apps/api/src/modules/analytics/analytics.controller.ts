import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { TracksService } from 'src/modules/tracks/tracks.service';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';

@Controller('api/me')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly tracksService: TracksService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: UserEntity) {
    return this.analyticsService.getCreatorDashboard(user);
  }

  @Get('tracks/:id/analytics')
  getTrackAnalytics(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.analyticsService.getTrackAnalytics(user, id);
  }

  @Get('history')
  getHistory(@CurrentUser() user: UserEntity) {
    return this.tracksService.getListeningHistory(user.id);
  }
}
