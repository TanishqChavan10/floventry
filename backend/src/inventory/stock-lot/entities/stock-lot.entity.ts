import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Company } from '../../../company/company.entity';
import { Warehouse } from '../../../warehouse/warehouse.entity';
import { Product } from '../../entities/product.entity';

export enum LotSourceType {
  OPENING = 'OPENING',
  GRN = 'GRN',
  TRANSFER = 'TRANSFER',
}

// Register the enum for GraphQL
import { registerEnumType } from '@nestjs/graphql';
registerEnumType(LotSourceType, {
  name: 'LotSourceType',
  description: 'Source of the stock lot',
});

@ObjectType()
@Entity('stock_lots')
@Index(['product_id', 'warehouse_id', 'expiry_date'])
@Index(['received_at'])
@Index(['expiry_date'])
@Index(['company_id', 'product_id']) // Company-level lot aggregation
export class StockLot {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  company_id: string;

  @Field(() => ID)
  @Column('uuid')
  warehouse_id: string;

  @Field(() => ID)
  @Column('uuid')
  product_id: string;

  @Field({ nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Field({ nullable: true })
  @Column('timestamp', { nullable: true })
  expiry_date: Date;

  @Field()
  @Column('timestamp')
  received_at: Date;

  @Field(() => LotSourceType)
  @Column({
    type: 'enum',
    enum: LotSourceType,
  })
  source_type: LotSourceType;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  source_id: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Field(() => Product)
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
