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

  // Purchase Order Settings
  @Column({ default: false })
  po_require_approval: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  po_approval_threshold: number;

  @Column({ default: false })
  po_auto_receive: boolean;

  @Column({ nullable: true })
  po_default_payment_terms: string;

  // Notification Settings
  @Column({ default: true })
  notify_low_stock: boolean;

  @Column({ default: true })
  notify_expiry: boolean;

  @Column({ default: true })
  notify_po_status: boolean;

  @Column({ default: true })
  notify_transfers: boolean;

  // Access & Security
  @Column({ default: 'WAREHOUSE_STAFF' })
  default_user_role: string;

  @Column({ default: true })
  restrict_manager_catalog: boolean;

  @Column({ default: true })
  restrict_staff_stock: boolean;

  @Column({ type: 'int', nullable: true })
  session_timeout_minutes: number;

  // Audit & Activity
  @Column({ default: true })
  enable_audit_logs: boolean;

  @Column({ default: 90 })
  audit_retention_days: number;

  @Column({ default: true })
  track_stock_adjustments: boolean;

  // Subscription / Plan flags
  // V1 usage: Global search barcode matching is enabled only when is_premium is true.
  @Column({ default: false })
  is_premium: boolean;

  @CreateDateColumn()
  created_at: Date;
}
