import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeleteEntity } from 'src/database/entities/base.entity';
import { TrackEntity } from 'src/database/entities/track.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('comments')
export class CommentEntity extends SoftDeleteEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  trackId!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'int', nullable: true })
  timestampSeconds!: number | null;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ default: false })
  isHidden!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => TrackEntity, (track) => track.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;

  @ManyToOne(() => CommentEntity, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent!: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parent)
  replies!: CommentEntity[];
}
