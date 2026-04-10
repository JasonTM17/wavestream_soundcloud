import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('likes')
@Index(['userId', 'trackId'], { unique: true })
export class LikeEntity extends AppBaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  trackId!: string;

  @ManyToOne(() => UserEntity, (user) => user.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => TrackEntity, (track) => track.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;
}
