import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../../inventory/entities/product.entity';

@ObjectType()
@Entity('sales_order_items')
@Index(['sales_order_id'])
export class SalesOrderItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  sales_order_id: string;

  @Field(() => SalesOrder)
  @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: Relation<SalesOrder>;

  @Field()
  @Column('uuid')
  product_id: string;

  @Field(() => Product)
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  ordered_quantity: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  issued_quantity: number;

  // Virtual field - computed
  @Field(() => Float)
  get pending_quantity(): number {
    return this.ordered_quantity - this.issued_quantity;
  }
}
