import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Company } from '../company/company.entity';

import { User } from '../auth/entities/user.entity';

@Entity('user_companies')
export class UserCompany {
  @PrimaryGeneratedColumn('uuid')
  membership_id: string;

  @Column({ type: 'text' })
  user_id: string;

  @Column('uuid')
  company_id: string;

  @Column({ default: 'STAFF' })
  role: string;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ type: 'text', nullable: true })
  invited_by: string;

  @Column({ length: 20, default: 'active' })
  status: string; // active, pending, inactive

  @Column({ type: 'uuid', nullable: true })
  default_warehouse_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;

  // @ManyToOne(() => Role)
  // @JoinColumn({ name: 'role_id' })
  // role: Role; Wait, I need to remove the import role relation otherwise duplicate role property.
  // Removing Role relation entirely.

  @ManyToOne(() => User, (user) => user.userCompanies)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;
}
