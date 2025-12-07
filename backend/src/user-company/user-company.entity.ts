import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../config/company/company.entity';
import { Role } from '../auth/enums/role.enum';
import { User } from '../auth/entities/user.entity';

@Entity('user_companies')
export class UserCompany {
    @PrimaryGeneratedColumn('uuid')
    membership_id: string;

    @Column({ type: 'text' })
    user_id: string;

    @Column('uuid')
    company_id: string;

    @Column({ type: 'enum', enum: Role, default: Role.WAREHOUSE_STAFF })
    role: Role;

    @CreateDateColumn()
    joined_at: Date;

    @Column({ type: 'text', nullable: true })
    invited_by: string;

    @Column({ length: 20, default: 'active' })
    status: string; // active, pending, inactive

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    // @ManyToOne(() => Role)
    // @JoinColumn({ name: 'role_id' })
    // role: Role; Wait, I need to remove the import role relation otherwise duplicate role property.
    // Removing Role relation entirely.

    @ManyToOne(() => User, (user) => user.userCompanies)
    @JoinColumn({ name: 'user_id' })
    user: User;
}