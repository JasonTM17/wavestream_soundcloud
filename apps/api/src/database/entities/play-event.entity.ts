import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('play_events')
export class PlayEventEntity extends AppBaseEntity {
  @Column({ type: 'uuid' })
  trackId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'int', default: 0 })
  durationListened!: number;

  @Column({ type: 'varchar', length: 50, default: 'player' })
  source!: string;

  @Column({ type: 'timestamp' })
  playedAt!: Date;

  @ManyToOne(() => TrackEntity, (track) => track.playEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;

  @ManyToOne(() => UserEntity, (user) => user.playEvents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity | null;
}
