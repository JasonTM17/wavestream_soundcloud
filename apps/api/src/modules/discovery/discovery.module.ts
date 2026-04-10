import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { DiscoveryController } from 'src/modules/discovery/discovery.controller';
import { DiscoveryService } from 'src/modules/discovery/discovery.service';
import { RelatedTracksController } from 'src/modules/discovery/related-tracks.controller';
import { SearchController } from 'src/modules/discovery/search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GenreEntity,
      PlaylistEntity,
      TrackEntity,
      UserEntity,
    ]),
  ],
  controllers: [DiscoveryController, SearchController, RelatedTracksController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
