import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from 'src/database/entities/base.entity';
import { PlaylistTrackEntity } from 'src/database/entities/playlist-track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('playlists')
export class PlaylistEntity extends SoftDeleteEntity {
  @Index({ unique: true })
  @Column()
  slug!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  coverUrl!: string | null;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ type: 'int', default: 0 })
  trackCount!: number;

  @Column({ type: 'int', default: 0 })
  totalDuration!: number;

  @ManyToOne(() => UserEntity, (user) => user.playlists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: UserEntity;

  @OneToMany(() => PlaylistTrackEntity, (playlistTrack) => playlistTrack.playlist)
  tracks!: PlaylistTrackEntity[];
}
