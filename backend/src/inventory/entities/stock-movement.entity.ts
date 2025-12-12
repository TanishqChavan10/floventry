import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Stock } from './stock.entity';
import { Product } from './product.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';
import { Company } from '../../company/company.entity';
import { User } from '../../auth/entities/user.entity';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum ReferenceType {
    PURCHASE_ORDER = 'PURCHASE_ORDER',
    SALES_ORDER = 'SALES_ORDER',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER = 'TRANSFER',
    MANUAL = 'MANUAL',
}

// Register enums for GraphQL
registerEnumType(MovementType, {
    name: 'MovementType',
    description: 'Type of stock movement',
});

registerEnumType(ReferenceType, {
    name: 'ReferenceType',
    description: 'Reference type for stock movement',
});

@ObjectType()
@Entity('stock_movements')
@Index(['warehouse_id', 'created_at']) // Optimize queries by warehouse and time
@Index(['product_id', 'created_at']) // Optimize queries by product and time
@Index(['company_id', 'created_at']) // Optimize company-scoped queries
export class StockMovement {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column('uuid')
    stock_id: string;

    @Field(() => Stock)
    @ManyToOne(() => Stock, { nullable: false })
    @JoinColumn({ name: 'stock_id' })
    stock: Stock;

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

    @Field(() => MovementType)
    @Column({
        type: 'enum',
        enum: MovementType,
    })
    type: MovementType;

    @Field(() => Float)
    @Column('decimal', { precision: 10, scale: 2 })
    quantity: number; // Positive for IN, negative for OUT/ADJUSTMENT

    @Field(() => Float)
    @Column('decimal', { precision: 10, scale: 2 })
    previous_quantity: number;

    @Field(() => Float)
    @Column('decimal', { precision: 10, scale: 2 })
    new_quantity: number;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    reason: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    reference_id: string;

    @Field(() => ReferenceType, { nullable: true })
    @Column({
        type: 'enum',
        enum: ReferenceType,
        nullable: true,
    })
    reference_type: ReferenceType;

    @Field()
    @Column('uuid')
    performed_by: string;

    @Field(() => User)
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'performed_by' })
    user: User;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    notes: string;

    @Field()
    @CreateDateColumn()
    created_at: Date;
}
