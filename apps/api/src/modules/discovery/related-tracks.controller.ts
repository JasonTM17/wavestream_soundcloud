import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { DiscoveryService } from 'src/modules/discovery/discovery.service';

@Controller('api/tracks')
export class RelatedTracksController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Public()
  @Get(':id/related')
  getRelatedTracks(@Param('id') id: string) {
    return this.discoveryService.getRelatedTracksById(id);
  }
}
