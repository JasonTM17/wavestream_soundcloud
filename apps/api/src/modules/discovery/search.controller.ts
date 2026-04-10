import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserEntity } from 'src/database/entities/user.entity';
import { SearchQueryDto } from 'src/modules/discovery/dto/search-query.dto';
import { DiscoveryService } from 'src/modules/discovery/discovery.service';

@Controller('api')
export class SearchController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Public()
  @Get('search')
  search(@Query() query: SearchQueryDto, @CurrentUser() user?: UserEntity) {
    return this.discoveryService.search(query.q, user);
  }

  @Public()
  @Get('genres')
  getGenres() {
    return this.discoveryService.getGenres();
  }
}
