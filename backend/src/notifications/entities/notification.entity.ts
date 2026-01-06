import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
    STOCK_LOW = 'STOCK_LOW',
    STOCK_CRITICAL = 'STOCK_CRITICAL',
    STOCK_EXPIRED = 'STOCK_EXPIRED',
    STOCK_EXPIRING_SOON = 'STOCK_EXPIRING_SOON',
    GRN_POSTED = 'GRN_POSTED',
    ISSUE_POSTED = 'ISSUE_POSTED',
    TRANSFER_COMPLETED = 'TRANSFER_COMPLETED',
    IMPORT_COMPLETED = 'IMPORT_COMPLETED',
    IMPORT_PARTIAL_FAILURE = 'IMPORT_PARTIAL_FAILURE',
}

registerEnumType(NotificationType, {
    name: 'NotificationType',
});

export enum NotificationSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

registerEnumType(NotificationSeverity, {
    name: 'NotificationSeverity',
});

@ObjectType()
@Entity('notifications')
@Index(['user_id', 'read_at'])
@Index(['company_id', 'created_at'])
@Index(['entity_id', 'type'])
export class Notification {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => ID)
    @Column('uuid')
    company_id: string;

    @Field(() => ID)
    @Column('uuid')
    user_id: string;

    @Field(() => NotificationType)
    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Field(() => NotificationSeverity)
    @Column({
        type: 'enum',
        enum: NotificationSeverity,
        default: NotificationSeverity.INFO,
    })
    severity: NotificationSeverity;

    @Field()
    @Column('varchar', { length: 255 })
    entity_type: string;

    @Field(() => ID)
    @Column('uuid')
    entity_id: string;

    @Field()
    @Column('varchar', { length: 255 })
    title: string;

    @Field()
    @Column('text')
    message: string;

    @Field(() => String, { nullable: true })
    @Column('jsonb', { nullable: true })
    metadata: any;

    @Field({ nullable: true })
    @Column('timestamp', { nullable: true })
    read_at: Date | null;

    @Field()
    @CreateDateColumn()
    created_at: Date;
}
