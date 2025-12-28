import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { GoodsReceiptNote } from './goods-receipt-note.entity';
import { PurchaseOrderItem } from '../../purchase-orders/entities/purchase-order-item.entity';
import { Product } from './product.entity';

@ObjectType()
@Entity('grn_items')
export class GRNItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid')
    goods_receipt_note_id: string;

    @ManyToOne(() => GoodsReceiptNote, (grn) => grn.items, { nullable: false })
    @JoinColumn({ name: 'goods_receipt_note_id' })
    goods_receipt_note: GoodsReceiptNote;

    @Column('uuid')
    purchase_order_item_id: string;

    @Field(() => PurchaseOrderItem)
    @ManyToOne(() => PurchaseOrderItem, { nullable: false })
    @JoinColumn({ name: 'purchase_order_item_id' })
    purchase_order_item: PurchaseOrderItem;

    @Column('uuid')
    product_id: string;

    @Field(() => Product)
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Field()
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    received_quantity: number;

    @Field()
    @CreateDateColumn()
    created_at: Date;
}
