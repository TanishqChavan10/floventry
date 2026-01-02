import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../inventory/entities/product.entity';

@ObjectType()
@Entity('purchase_order_items')
export class PurchaseOrderItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column('uuid')
    purchase_order_id: string;

    @Field(() => PurchaseOrder)
    @ManyToOne(() => PurchaseOrder, (po) => po.items, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'purchase_order_id' })
    purchase_order: PurchaseOrder;

    @Field()
    @Column('uuid')
    product_id: string;

    @Field(() => Product)
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Field(() => Float)
    @Column('decimal', { precision: 10, scale: 2 })
    ordered_quantity: number;

    @Field(() => Float)
    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    received_quantity: number;

    @Field()
    @CreateDateColumn()
    created_at: Date;
}
