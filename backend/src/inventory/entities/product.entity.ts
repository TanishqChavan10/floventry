import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './category.entity';
import { Supplier } from '../../supplier/supplier.entity';
import { Company } from '../../company/company.entity';
import { Company as CompanyModel } from '../../company/company.model';

@ObjectType()
@Entity('products')
@Index(['company_id', 'sku'], { unique: true }) // Ensure SKU is unique per company
@Index(['company_id']) // Optimize company-scoped queries
export class Product {
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

    @Field()
    @Column()
    sku: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    barcode: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    category_id: string;

    @Field(() => Category, { nullable: true })
    @ManyToOne(() => Category, (category) => category.products, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Field({ nullable: true })
    @Column({ nullable: true })
    supplier_id: string;

    // Relation to Supplier
    @Field(() => Supplier, { nullable: true })
    @ManyToOne(() => Supplier, (supplier) => supplier.products, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'supplier_id' })
    supplier: Supplier;

    @Field()
    @Column()
    unit: string;

    @Field(() => Float, { nullable: true })
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    cost_price: number;

    @Field(() => Float, { nullable: true })
    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    selling_price: number;

    @Field({ nullable: true })
    // Using 'text' for simpler image storage (URL) 
    @Column({ nullable: true })
    image_url: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    description: string;

    @Field()
    @Column({ default: true })
    is_active: boolean;

    @Field()
    @CreateDateColumn()
    created_at: Date;

    @Field()
    @UpdateDateColumn()
    updated_at: Date;
}
