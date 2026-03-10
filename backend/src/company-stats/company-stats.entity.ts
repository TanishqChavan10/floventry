import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('company_stats')
@Index(['company_id'], { unique: true })
export class CompanyStats {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid', { unique: true })
  company_id: string;

  // ── Product / SKU counters ──

  @Field(() => Int)
  @Column('int', { default: 0 })
  total_products: number;

  // ── Stock counters ──

  @Field(() => Float)
  @Column('decimal', { precision: 14, scale: 2, default: 0 })
  total_stock_units: number;

  @Field(() => Int)
  @Column('int', { default: 0 })
  low_stock_count: number;

  @Field(() => Int)
  @Column('int', { default: 0 })
  critical_stock_count: number;

  // ── Expiry counters ──

  @Field(() => Int)
  @Column('int', { default: 0 })
  expiring_soon_count: number;

  @Field(() => Int)
  @Column('int', { default: 0 })
  expired_count: number;

  // ── Warehouse counter ──

  @Field(() => Int)
  @Column('int', { default: 0 })
  total_warehouses: number;

  // ── Order counters ──

  @Field(() => Int)
  @Column('int', { default: 0 })
  total_purchase_orders: number;

  @Field(() => Int)
  @Column('int', { default: 0 })
  total_sales_orders: number;

  // ── Timestamps ──

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
