import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Company } from '../../company/company.entity';
import { User } from '../../auth/entities/user.entity';
import { SalesOrderItem } from './sales-order-item.entity';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(SalesOrderStatus, {
  name: 'SalesOrderStatus',
  description: 'Status of a sales order',
});

@ObjectType()
@Entity('sales_orders')
@Index(['company_id'])
export class SalesOrder {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true })
  order_number: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Field(() => SalesOrderStatus)
  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.DRAFT,
  })
  status: SalesOrderStatus;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      to: (value: Date | null | undefined) => {
        if (!value) return null;
        // Store as a date-only string to avoid timezone shifts (DATE has no timezone)
        return value.toISOString().slice(0, 10);
      },
      from: (value: string | Date | null) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        // DB 'date' columns may come back as YYYY-MM-DD strings
        return new Date(value);
      },
    },
  })
  expected_dispatch_date: Date | null;

  @Field()
  @Column('uuid')
  created_by: string;

  @Field(() => User)
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: Relation<User>;

  @Field(() => [SalesOrderItem], { nullable: true })
  @OneToMany(() => SalesOrderItem, (item) => item.sales_order, {
    cascade: true,
  })
  items: Relation<SalesOrderItem>[];

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
