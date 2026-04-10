import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { AppBaseEntity } from 'src/database/entities/base.entity';
import { UserEntity } from 'src/database/entities/user.entity';

@Entity('profiles')
export class ProfileEntity extends AppBaseEntity {
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  bannerUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  websiteUrl!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location!: string | null;

  @OneToOne(() => UserEntity, (user) => user.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
