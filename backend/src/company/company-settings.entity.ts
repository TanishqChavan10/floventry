import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Company, (company) => company.settings)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  company_id: string; // FK → companies

  @Column({ default: 'INR' })
  currency: string; // Default: INR

  @Column()
  timezone: string;

  @Column()
  stock_costing_method: string; // FIFO / LIFO / AVG

  @Column({ type: 'int', nullable: true })
  low_stock_threshold: number; // Global default

  @Column({ default: false })
  allow_negative_stock: boolean; // Default: false

  @CreateDateColumn()
  created_at: Date;
}