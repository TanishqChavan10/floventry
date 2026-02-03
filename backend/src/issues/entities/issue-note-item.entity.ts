import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IssueNote } from './issue-note.entity';
import { Product } from '../../inventory/entities/product.entity';
import { StockLot } from '../../inventory/entities/stock-lot.entity';

@ObjectType()
@Entity('issue_note_items')
@Index(['issue_note_id'])
@Index(['product_id'])
@Index(['stock_lot_id'])
export class IssueNoteItem {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  issue_note_id: string;

  @Field(() => IssueNote)
  @ManyToOne(() => IssueNote, (note) => note.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issue_note_id' })
  issue_note: IssueNote;

  @Field()
  @Column('uuid')
  product_id: string;

  @Field(() => Product)
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  stock_lot_id: string;

  @Field(() => StockLot, { nullable: true })
  @ManyToOne(() => StockLot, { nullable: true })
  @JoinColumn({ name: 'stock_lot_id' })
  stock_lot: StockLot;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;
}
