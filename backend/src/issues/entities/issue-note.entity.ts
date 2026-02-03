import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/company.entity';
import { Warehouse } from '../../warehouse/warehouse.entity';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { User } from '../../auth/entities/user.entity';
import { IssueNoteItem } from './issue-note-item.entity';

export enum IssueNoteStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(IssueNoteStatus, {
  name: 'IssueNoteStatus',
  description: 'Status of an issue note',
});

@ObjectType()
@Entity('issue_notes')
@Index(['company_id'])
@Index(['warehouse_id'])
@Index(['sales_order_id'])
export class IssueNote {
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
  @Column('uuid')
  warehouse_id: string;

  @Field(() => Warehouse, { nullable: true })
  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Field()
  @Column({ type: 'varchar', length: 50, unique: true })
  issue_number: string;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  sales_order_id: string;

  @Field(() => SalesOrder, { nullable: true })
  @ManyToOne(() => SalesOrder, { nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Field(() => IssueNoteStatus)
  @Column({
    type: 'enum',
    enum: IssueNoteStatus,
    default: IssueNoteStatus.DRAFT,
  })
  status: IssueNoteStatus;

  @Field({ nullable: true })
  @Column('uuid', { nullable: true })
  issued_by: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'issued_by' })
  issuer: User;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  issued_at: Date;

  @Field(() => [IssueNoteItem], { nullable: true })
  @OneToMany(() => IssueNoteItem, (item) => item.issue_note, { cascade: true })
  items: IssueNoteItem[];

  @Field()
  @CreateDateColumn()
  created_at: Date;
}
