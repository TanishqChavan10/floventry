import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import GraphQLJSONObject from 'graphql-type-json';
import { UserCompany } from '../../user-company/user-company.entity';
import { UserWarehouse } from './user-warehouse.entity';

@ObjectType()
@Entity('app_users')
export class User {
  @Field(() => ID)
  @PrimaryColumn({ type: 'text' })
  id: string; // Clerk ID

  @Field()
  @Column({ type: 'text' })
  email: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  fullName: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  avatarUrl: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  activeCompanyId: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  preferences: any;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @OneToMany(() => UserCompany, (userCompany) => userCompany.user)
  userCompanies: UserCompany[];

  @OneToMany(() => UserWarehouse, (userWarehouse) => userWarehouse.user)
  userWarehouses: UserWarehouse[];
}
