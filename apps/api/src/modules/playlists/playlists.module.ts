import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { PlaylistTrackEntity } from 'src/database/entities/playlist-track.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { PlaylistsController } from 'src/modules/playlists/playlists.controller';
import { PlaylistsService } from 'src/modules/playlists/playlists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlaylistEntity, PlaylistTrackEntity, TrackEntity, UserEntity]),
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
