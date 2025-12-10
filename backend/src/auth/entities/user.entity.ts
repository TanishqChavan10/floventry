import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn
} from 'typeorm';
import { UserCompany } from '../../user-company/user-company.entity';
import { UserWarehouse } from './user-warehouse.entity';

@Entity('app_users')
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string; // Clerk ID

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  activeCompanyId: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => UserCompany, (userCompany) => userCompany.user)
  userCompanies: UserCompany[];

  @OneToMany(() => UserWarehouse, (userWarehouse) => userWarehouse.user)
  userWarehouses: UserWarehouse[];
}
