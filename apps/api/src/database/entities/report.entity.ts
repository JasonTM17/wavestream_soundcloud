import { ReportStatus, ReportableType } from '@wavestream/shared';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('reports')
export class ReportEntity extends AppBaseEntity {
  @Column({ type: 'uuid' })
  reporterId!: string;

  @Column({ type: 'varchar' })
  reportableType!: ReportableType;

  @Column()
  reportableId!: string;

  @Column({ type: 'varchar', length: 120 })
  reason!: string;

  @Column({ type: 'text', nullable: true })
  details!: string | null;

  @Column({ type: 'varchar', default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.reports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporterId' })
  reporter!: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.resolvedReports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy!: UserEntity | null;
}
