import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column({ default: 'INFO' })
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

    @Column({ default: false })
    isRead: boolean;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
