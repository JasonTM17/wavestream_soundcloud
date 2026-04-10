import { AdminActionType } from '@wavestream/shared';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('audit_logs')
export class AuditLogEntity extends AppBaseEntity {
  @Column()
  adminId!: string;

  @Column({ type: 'varchar' })
  action!: AdminActionType;

  @Column({ type: 'varchar', length: 80 })
  entityType!: string;

  @Column({ type: 'varchar', nullable: true })
  entityId!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  details!: Record<string, unknown> | null;

  @ManyToOne(() => UserEntity, (user) => user.auditLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'adminId' })
  admin!: UserEntity;
}
