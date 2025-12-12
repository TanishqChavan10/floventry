import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Company } from '../company/company.entity';
import { Company as CompanyModel } from '../company/company.model';

@ObjectType()
@Entity('suppliers')
@Index(['company_id']) // Optimize company-scoped queries
export class Supplier {
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
    name: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    email: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    phone: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    address: string;

    @Field()
    @Column({ default: true })
    isActive: boolean;

    // Relationship to products supplied by this supplier
    @OneToMany('Product', 'supplier', { lazy: true })
    products: Promise<any[]>;

    @Field()
    @CreateDateColumn()
    created_at: Date;

    @Field()
    @UpdateDateColumn()
    updated_at: Date;
}
