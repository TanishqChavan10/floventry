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

  @CreateDateColumn()
  created_at: Date;
}
