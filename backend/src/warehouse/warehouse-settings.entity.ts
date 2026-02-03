import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_settings')
export class WarehouseSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Warehouse, (warehouse) => warehouse.settings)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column('uuid')
  warehouse_id: string;

  // Inventory Rules (Overrides)
  @Column({ type: 'int', nullable: true })
  low_stock_threshold: number;

  @Column({ type: 'int', nullable: true })
  expiry_warning_days: number;

  @Column({ nullable: true })
  allow_negative_stock: boolean;

  // Transfer Rules
  @Column({ default: true })
  allow_inbound_transfers: boolean;

  @Column({ default: true })
  allow_outbound_transfers: boolean;

  @Column({ default: false })
  require_transfer_approval: boolean;

  @CreateDateColumn()
  created_at: Date;
}
