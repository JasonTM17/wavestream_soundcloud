import { TrackPrivacy, TrackStatus } from '@wavestream/shared';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { SoftDeleteEntity } from 'src/database/entities/base.entity';
import { CommentEntity } from 'src/database/entities/comment.entity';
import { GenreEntity } from 'src/database/entities/genre.entity';
import { LikeEntity } from 'src/database/entities/like.entity';
import { PlayEventEntity } from 'src/database/entities/play-event.entity';
import { PlaylistTrackEntity } from 'src/database/entities/playlist-track.entity';
import { RepostEntity } from 'src/database/entities/repost.entity';
import { TagEntity } from 'src/database/entities/tag.entity';
import { TrackFileEntity } from 'src/database/entities/track-file.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('tracks')
export class TrackEntity extends SoftDeleteEntity {
  @Index({ unique: true })
  @Column()
  slug!: string;

  @Column({ type: 'uuid' })
  artistId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  coverUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  duration!: number;

  @Column({
    type: 'varchar',
    default: TrackPrivacy.PUBLIC,
  })
  privacy!: TrackPrivacy;

  @Column({
    type: 'varchar',
    default: TrackStatus.DRAFT,
  })
  status!: TrackStatus;

  @Column({ default: true })
  allowDownloads!: boolean;

  @Column({ default: true })
  commentsEnabled!: boolean;

  @Column({ type: 'int', default: 0 })
  playCount!: number;

  @Column({ type: 'int', default: 0 })
  likeCount!: number;

  @Column({ type: 'int', default: 0 })
  repostCount!: number;

  @Column({ type: 'int', default: 0 })
  commentCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hiddenReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  genreId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.tracks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'artistId' })
  artist!: UserEntity;

  @ManyToOne(() => GenreEntity, (genre) => genre.tracks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'genreId' })
  genre!: GenreEntity | null;

  @ManyToMany(() => TagEntity, (tag) => tag.tracks, { cascade: true })
  @JoinTable({
    name: 'track_tags',
    joinColumn: { name: 'trackId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: TagEntity[];

  @OneToOne(() => TrackFileEntity, (trackFile) => trackFile.track, {
    cascade: true,
  })
  file!: TrackFileEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.track)
  comments!: CommentEntity[];

  @OneToMany(() => LikeEntity, (like) => like.track)
  likes!: LikeEntity[];

  @OneToMany(() => RepostEntity, (repost) => repost.track)
  reposts!: RepostEntity[];

  @OneToMany(() => PlaylistTrackEntity, (playlistTrack) => playlistTrack.track)
  playlistEntries!: PlaylistTrackEntity[];

  @OneToMany(() => PlayEventEntity, (event) => event.track)
  playEvents!: PlayEventEntity[];
}
