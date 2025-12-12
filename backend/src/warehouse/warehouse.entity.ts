import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Company } from '../company/company.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';

@ObjectType()
@Entity('warehouses')
export class Warehouse {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  company_id: string; // FK → companies

  @Field()
  @Column()
  name: string; // Warehouse name

  @Field({ nullable: true })
  @Column({ nullable: true })
  slug: string; // url slug

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address: string; // Physical address

  @Field({ nullable: true })
  @Column({ nullable: true })
  type: string; // Main / Retail / Virtual / FBA

  @Field({ nullable: true })
  @Column({ nullable: true })
  code: string; // WH-01

  @Field({ nullable: true })
  @Column({ nullable: true })
  timezone: string;

  @Field()
  @Column({ default: false })
  is_default: boolean;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field({ nullable: true })
  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date; // Soft delete

  // Relationships
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // @OneToMany(() => UserWarehouse, (userWarehouse) => userWarehouse.userWarehouses) // Note: original code had typo userWarehouse.userWarehouses? No, it was userWarehouse.warehouse.
  // userWarehouses: UserWarehouse[];
}