import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
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
import { Product } from './product.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';
import { Company } from '../../company/company.entity';
import { StockLot } from './stock-lot.entity';

@ObjectType()
@Entity('stock')
@Index(['product_id', 'warehouse_id'], { unique: true }) // One stock record per product per warehouse
@Index(['warehouse_id']) // Optimize warehouse-scoped queries
@Index(['company_id']) // Optimize company-scoped queries
export class Stock {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  product_id: string;

  @Field(() => Product)
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Field()
  @Column('uuid')
  warehouse_id: string;

  @Field(() => Warehouse)
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Field()
  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  min_stock_level: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  max_stock_level: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  reorder_point: number;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  // Not a real TypeORM relation (stock_lots doesn't FK to stock).
  // Resolved via a GraphQL @ResolveField in the Stock resolver.
  @Field(() => [StockLot], { nullable: true })
  lots?: StockLot[];
}
