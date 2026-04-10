import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { TrackEntity } from 'src/database/entities/track.entity';

@Entity('track_files')
export class TrackFileEntity extends AppBaseEntity {
  @Column({ type: 'uuid', unique: true })
  trackId!: string;

  @Column()
  bucket!: string;

  @Column()
  objectKey!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'bigint' })
  sizeBytes!: number;

  @Column({ type: 'int' })
  durationSeconds!: number;

  @Column({ type: 'text', nullable: true })
  publicUrl!: string | null;

  @OneToOne(() => TrackEntity, (track) => track.file, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackId' })
  track!: TrackEntity;
}
