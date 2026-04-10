import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { DiscoveryService } from 'src/modules/discovery/discovery.service';

@Controller('api/discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Public()
  @Get('home')
  getHomeFeed(@CurrentUser() user?: UserEntity) {
    return this.discoveryService.getHomeFeed(user);
  }
}
