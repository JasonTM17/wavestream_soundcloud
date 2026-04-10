import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { PlaylistEntity } from 'src/database/entities/playlist.entity';
import { TrackEntity } from 'src/database/entities/track.entity';

@Entity('playlist_tracks')
@Index(['playlistId', 'trackId'], { unique: true })
export class PlaylistTrackEntity extends AppBaseEntity {
  @Column({ type: 'uuid' })
  playlistId!: string;

  @Column({ type: 'uuid' })
  trackId!: string;

  @Column({ type: 'int' })
  position!: number;

  @ManyToOne(() => PlaylistEntity, (playlist) => playlist.tracks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlistId' })
  playlist!: PlaylistEntity;

  @ManyToOne(() => TrackEntity, (track) => track.playlistEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;
}
