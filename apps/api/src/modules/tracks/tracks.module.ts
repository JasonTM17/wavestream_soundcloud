import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { TagEntity } from 'src/database/entities/tag.entity';
import { TrackFileEntity } from 'src/database/entities/track-file.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import { TracksController } from 'src/modules/tracks/tracks.controller';
import { TracksService } from 'src/modules/tracks/tracks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrackEntity,
      TrackFileEntity,
      GenreEntity,
      TagEntity,
      UserEntity,
    ]),
  ],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
