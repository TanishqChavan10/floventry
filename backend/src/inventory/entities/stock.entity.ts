import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
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

    @Field(() => Int)
    @Column('integer', { default: 0 })
    quantity: number;

    @Field(() => Int, { nullable: true })
    @Column('integer', { nullable: true })
    min_stock_level: number;

    @Field(() => Int, { nullable: true })
    @Column('integer', { nullable: true })
    max_stock_level: number;

    @Field(() => Int, { nullable: true })
    @Column('integer', { nullable: true })
    reorder_point: number;

    @Field()
    @CreateDateColumn()
    created_at: Date;

    @Field()
    @UpdateDateColumn()
    updated_at: Date;

    // Virtual relation to stock lots (aggregated view)
    @Field(() => [StockLot], { nullable: true })
    @OneToMany(() => StockLot, lot => lot.product_id && lot.warehouse_id, { lazy: true })
    lots: StockLot[];
}
