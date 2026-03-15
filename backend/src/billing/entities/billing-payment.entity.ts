import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BillingInterval } from '../types/billing.types';

@Entity('billing_payments')
export class BillingPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  company_id: string;

  @Index()
  @Column('uuid')
  user_id: string;

  @Column({ type: 'enum', enum: ['STANDARD', 'PRO'] })
  plan: 'STANDARD' | 'PRO';

  @Column({ type: 'enum', enum: BillingInterval })
  interval: BillingInterval;

  /** Amount in paise. */
  @Column({ type: 'int' })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'CREATED' })
  status: 'CREATED' | 'PAID' | 'FAILED';

  @Index({ unique: true })
  @Column({ nullable: true })
  razorpay_order_id?: string;

  // NOT unique: a subscription can generate multiple payments over time.
  @Index()
  @Column({ nullable: true })
  razorpay_subscription_id?: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  razorpay_payment_id?: string;

  @Index()
  @Column({ nullable: true })
  razorpay_invoice_id?: string;

  @Column({ nullable: true })
  razorpay_invoice_url?: string;

  @Column({ nullable: true })
  receipt?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paid_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
