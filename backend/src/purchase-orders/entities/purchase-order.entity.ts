import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Company } from '../../company/company.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';
import { Supplier } from '../../supplier/supplier.entity';
import { User } from '../../auth/entities/user.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(PurchaseOrderStatus, {
  name: 'PurchaseOrderStatus',
});

@ObjectType()
@Entity('purchase_orders')
@Index(['company_id', 'created_at'])
@Index(['company_id', 'warehouse_id'])
@Index(['company_id', 'status'])
export class PurchaseOrder {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  warehouse_id: string;

  @Field(() => Warehouse)
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column('uuid')
  supplier_id: string;

  @Field(() => Supplier)
  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  po_number: string;

  @Field(() => PurchaseOrderStatus)
  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  user_role: string;

  @Field(() => [PurchaseOrderItem])
  @OneToMany(() => PurchaseOrderItem, (item) => item.purchase_order, {
    cascade: true,
  })
  items: PurchaseOrderItem[];

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
