import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from '../../config/company/company.entity';

@Entity('user_companies')
export class UserCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
user_id: string;

  @Column('uuid')
  company_id: string;

  @Column()
  role: string; // owner/admin/manager/staff

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
@JoinColumn({ name: 'user_id' })
user: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}