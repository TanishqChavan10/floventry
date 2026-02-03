import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../company/company.entity';
import { Company as CompanyModel } from '../../company/company.model';

@ObjectType()
@Entity('units')
@Index(['company_id', 'shortCode'], { unique: true }) // Ensure shortCode is unique per company
@Index(['company_id']) // Optimize company-scoped queries
export class Unit {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  company_id: string;

  @Field(() => CompanyModel)
  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Field()
  @Column()
  name: string; // e.g., "Piece"

  @Field()
  @Column()
  shortCode: string; // e.g., "pcs"

  @Field()
  @Column({ default: false })
  isDefault: boolean;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;
}
