import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import GraphQLJSONObject from 'graphql-type-json';
import { Company } from '../../company/company.entity';
import { User } from '../../auth/entities/user.entity';
import { AuditAction, AuditEntityType } from '../enums/audit.enums';

// Register enums for GraphQL
registerEnumType(AuditAction, {
    name: 'AuditAction',
    description: 'Type of audit action',
});

registerEnumType(AuditEntityType, {
    name: 'AuditEntityType',
    description: 'Type of entity being audited',
});

@ObjectType()
@Entity('company_audit_logs')
@Index(['company_id', 'created_at']) // Optimize queries by company and time
@Index(['company_id', 'action']) // Optimize by company and action
@Index(['company_id', 'entity_type']) // Optimize by company and entity type
export class CompanyAuditLog {
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
    actor_user_id: string;

    @Field(() => User)
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'actor_user_id' })
    actor: User;

    @Field()
    @Column({ type: 'text' })
    actor_email: string;

    @Field() // Store as string to avoid GraphQL enum conflicts
    @Column({ type: 'text' })
    actor_role: string;

    @Field(() => AuditAction)
    @Column({
        type: 'enum',
        enum: AuditAction,
    })
    action: AuditAction;

    @Field(() => AuditEntityType)
    @Column({
        type: 'enum',
        enum: AuditEntityType,
    })
    entity_type: AuditEntityType;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    entity_id: string;

    // Metadata must be small, structured, and human-readable
    // Examples:
    // - { "warehouseName": "Mumbai Central", "previousStatus": "ACTIVE", "newStatus": "INACTIVE" }
    // - { "grnNumber": "GRN-2026-001", "itemCount": 15 }
    // Do NOT store full payloads or entity snapshots
    @Field(() => GraphQLJSONObject, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    ip_address: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @Field()
    @CreateDateColumn() // Stored in UTC automatically by TypeORM
    created_at: Date;
}
