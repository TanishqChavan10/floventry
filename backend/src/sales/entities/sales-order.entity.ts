import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
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
    company: Company;

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

    @Field({ nullable: true })
    @Column({ type: 'date', nullable: true })
    expected_dispatch_date: Date;

    @Field()
    @Column('uuid')
    created_by: string;

    @Field(() => User)
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @Field(() => [SalesOrderItem], { nullable: true })
    @OneToMany(() => SalesOrderItem, item => item.sales_order, { cascade: true })
    items: SalesOrderItem[];

    @Field()
    @CreateDateColumn()
    created_at: Date;

    @Field()
    @UpdateDateColumn()
    updated_at: Date;
}
