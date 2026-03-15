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

  @Column({ default: 30 })
  expiry_warning_days: number;

  @Column({ default: true })
  enable_expiry_tracking: boolean;

  @Column({ default: 'FIFO' })
  stock_valuation_method: string;

  // Access & Permissions
  @Column({ default: true })
  restrict_manager_catalog: boolean;

  // Subscription / Plan flags
  // V1 usage: Global search barcode matching is enabled only when is_premium is true.
  // Subscription / Plan
  @Column({
    type: 'enum',
    enum: ['FREE', 'STANDARD', 'PRO'],
    default: 'FREE',
  })
  plan: 'FREE' | 'STANDARD' | 'PRO';

  @CreateDateColumn()
  created_at: Date;
}
