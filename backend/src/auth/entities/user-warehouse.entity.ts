import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';

@Entity('user_warehouses')
export class UserWarehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  warehouse_id: string;

  @Column({ nullable: true })
  role: string; // Optional warehouse-level roles

  @Column({ default: false })
  is_manager_of_warehouse: boolean; // Indicates if user manages this warehouse

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;
}