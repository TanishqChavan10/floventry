import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('razorpay_webhook_events')
export class RazorpayWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  event_id: string;

  @Column({ type: 'varchar' })
  event_type: string;

  @CreateDateColumn({ type: 'timestamptz' })
  processed_at: Date;
}
