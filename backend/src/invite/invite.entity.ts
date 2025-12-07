import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../config/company/company.entity';
import { Role } from '../auth/enums/role.enum';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  invite_id: string;

  @Column({ length: 255 })
  email: string;

  @Column('uuid')
  company_id: string;

  @Column({ type: 'enum', enum: Role, default: Role.WAREHOUSE_STAFF })
  role: Role;

  @Column({ type: 'text' })
  invited_by: string;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, accepted, rejected, expired

  @Column({ length: 255, unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // @ManyToOne(() => Role)
  // @JoinColumn({ name: 'role_id' })
  // role: Role;
}