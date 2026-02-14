import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum BarcodeHistoryChangeType {
  PRIMARY_CHANGED = 'PRIMARY_CHANGED',
  ALTERNATE_ADDED = 'ALTERNATE_ADDED',
  ALTERNATE_REMOVED = 'ALTERNATE_REMOVED',
}

registerEnumType(BarcodeHistoryChangeType, {
  name: 'BarcodeHistoryChangeType',
  description: 'Type of barcode change recorded for audit/history',
});

@ObjectType()
@Entity('barcode_history')
@Index(['company_id', 'product_id', 'changed_at'])
export class BarcodeHistory {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column('uuid')
  company_id: string;

  @Field(() => ID)
  @Column('uuid')
  product_id: string;

  @Field(() => BarcodeHistoryChangeType)
  @Column({
    type: 'enum',
    enum: BarcodeHistoryChangeType,
  })
  change_type: BarcodeHistoryChangeType;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  old_value: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  new_value: string | null;

  @Field(() => String, { nullable: true })
  @Column('uuid', { nullable: true })
  changed_by_user_id: string | null;

  @Field(() => String, { nullable: true })
  @Column('text', { nullable: true })
  reason: string | null;

  @Field(() => Date)
  @CreateDateColumn()
  changed_at: Date;
}
