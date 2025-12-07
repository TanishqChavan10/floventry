import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../config/company/company.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  company_id: string; // FK → companies

  @Column()
  name: string; // Warehouse name

  @Column({ nullable: true })
  address: string; // Physical address

  @Column({ nullable: true })
  type: string; // Main / Retail / Virtual / FBA

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date; // Soft delete

  // Relationships
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // @OneToMany(() => UserWarehouse, (userWarehouse) => userWarehouse.userWarehouses) // Note: original code had typo userWarehouse.userWarehouses? No, it was userWarehouse.warehouse.
  // userWarehouses: UserWarehouse[];
}