import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/company.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';
import { User } from '../../auth/entities/user.entity';
import { WarehouseTransferItem } from './warehouse-transfer-item.entity';

export enum TransferStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(TransferStatus, {
  name: 'TransferStatus',
  description: 'The status of a warehouse transfer',
});

@ObjectType()
@Entity('warehouse_transfers')
@Index(['company_id'])
@Index(['source_warehouse_id'])
@Index(['destination_warehouse_id'])
@Index(['transfer_number'], { unique: true })
export class WarehouseTransfer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Field()
  @Column('uuid')
  source_warehouse_id: string;

  @Field(() => Warehouse)
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'source_warehouse_id' })
  source_warehouse: Warehouse;

  @Field()
  @Column('uuid')
  destination_warehouse_id: string;

  @Field(() => Warehouse)
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'destination_warehouse_id' })
  destination_warehouse: Warehouse;

  @Field()
  @Column({ unique: true })
  transfer_number: string;

  @Field(() => TransferStatus)
  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.DRAFT,
  })
  status: TransferStatus;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  notes: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  created_by: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  user_role: string;

  @Field(() => [WarehouseTransferItem])
  @OneToMany(() => WarehouseTransferItem, (item) => item.warehouse_transfer, {
    cascade: true,
  })
  items: WarehouseTransferItem[];

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
