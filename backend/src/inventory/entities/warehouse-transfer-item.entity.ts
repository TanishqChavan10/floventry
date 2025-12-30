import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WarehouseTransfer } from './warehouse-transfer.entity';
import { Product } from './product.entity';

@ObjectType()
@Entity('warehouse_transfer_items')
@Index(['warehouse_transfer_id'])
@Index(['product_id'])
export class WarehouseTransferItem {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column('uuid')
    warehouse_transfer_id: string;

    @ManyToOne(() => WarehouseTransfer, transfer => transfer.items, { nullable: false })
    @JoinColumn({ name: 'warehouse_transfer_id' })
    warehouse_transfer: WarehouseTransfer;

    @Field()
    @Column('uuid')
    product_id: string;

    @Field(() => Product)
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Field(() => Int)
    @Column('integer')
    quantity: number;

    @Field()
    @CreateDateColumn()
    created_at: Date;
}
