import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('listening_history')
export class ListeningHistoryEntity extends AppBaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  trackId!: string;

  @Column({ type: 'timestamp' })
  playedAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.listeningHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => TrackEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;
}
