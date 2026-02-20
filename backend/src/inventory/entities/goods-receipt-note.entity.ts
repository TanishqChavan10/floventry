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
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { User } from '../../auth/entities/user.entity';
import { GRNItem } from './grn-item.entity';

export enum GRNStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(GRNStatus, {
  name: 'GRNStatus',
});

@ObjectType()
@Entity('goods_receipt_notes')
@Index(['company_id', 'created_at'])
@Index(['company_id', 'warehouse_id'])
@Index(['company_id', 'status'])
export class GoodsReceiptNote {
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
  purchase_order_id: string;

  @Field(() => PurchaseOrder)
  @ManyToOne(() => PurchaseOrder, { nullable: false })
  @JoinColumn({ name: 'purchase_order_id' })
  purchase_order: PurchaseOrder;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true })
  grn_number: string;

  @Field(() => GRNStatus)
  @Column({
    type: 'enum',
    enum: GRNStatus,
    default: GRNStatus.DRAFT,
  })
  status: GRNStatus;

  @Field()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  received_at: Date;

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

  @Column({ type: 'uuid', nullable: true })
  posted_by: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'posted_by' })
  posted_by_user: User;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  posted_at: Date;

  @Field(() => [GRNItem])
  @OneToMany(() => GRNItem, (item) => item.goods_receipt_note, {
    cascade: true,
  })
  items: GRNItem[];

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
