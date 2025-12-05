import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string;

    @Column()
    userId: string;

    @Column({ nullable: true })
    entityId: string; // ID of the entity being modified (e.g., product_id)

    @Column({ nullable: true })
    entityType: string; // e.g., "Product", "Supplier"

    @Column({ type: 'jsonb', nullable: true })
    details: any; // Old value -> New value

    @Column({ nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;
}
