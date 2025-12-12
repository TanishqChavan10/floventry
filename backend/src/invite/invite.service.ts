// invite.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Invite } from './invite.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { SendInviteInput } from './dto/send-invite.input';
import { AcceptInviteInput } from './dto/accept-invite.input';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../auth/entities/user.entity';
import { Company } from '../company/company.entity';
import { EmailService } from '../email/email.service';
import { ClerkService } from '../auth/clerk.service';
import { UserWarehouseService } from '../auth/user-warehouse.service';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class InviteService {
  private readonly logger = new Logger(InviteService.name);

  constructor(
    @InjectRepository(Invite)
    private inviteRepository: Repository<Invite>,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private emailService: EmailService,
    private clerkService: ClerkService,
    private dataSource: DataSource,
    private userWarehouseService: UserWarehouseService,
  ) { }

  //------------------------------------------------------------
  // VALIDATE INVITE TOKEN (Used by both validate & accept)
  //------------------------------------------------------------
  async validateInviteToken(
    token: string,
    manager: EntityManager = this.inviteRepository.manager,
  ): Promise<Invite> {
    const invite = await manager.findOne(Invite, {
      where: { token, status: 'pending' },
      relations: ['company'],
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (invite.expires_at < new Date()) {
      invite.status = 'expired';
      await manager.save(invite);
      throw new BadRequestException('Invite has expired');
    }

    return invite;
  }

  //------------------------------------------------------------
  // CREATE INVITE
  //------------------------------------------------------------
  async createInvite(
    input: SendInviteInput,
    companyId: string,
    invitedBy: string,
  ): Promise<Invite> {
    const email = input.email.toLowerCase();
    const role = input.role.toUpperCase(); // Normalized to match Role enum

    this.logger.log(`Creating invite for ${email} to company ${companyId}`);

    const existingInvite = await this.inviteRepository.findOne({
      where: { email, company_id: companyId, status: 'pending' },
    });

    if (existingInvite) {
      throw new ConflictException('Invite already sent to this email');
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const inviter = await this.userRepository.findOne({ where: { id: invitedBy } });
    const inviterName = inviter?.fullName || inviter?.email || 'A team member';

    const invite = this.inviteRepository.create({
      email,
      company_id: companyId,
      role,
      warehouse_ids: input.warehouseIds || [],
      manages_warehouse_ids: input.managesWarehouseIds || [],
      invited_by: invitedBy,
      token: uuidv4(),
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    const savedInvite = await this.inviteRepository.save(invite);
    this.logger.log(`Invite saved successfully with token: ${savedInvite.token}`);

    // SEND EMAIL
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/accept?token=${savedInvite.token}`;
    try {
      await this.emailService.sendInviteEmail({
        to: email,
        companyName: company.name,
        invitedByName: inviterName,
        role,
        invitationLink,
      });
    } catch (err) {
      this.logger.error(`Failed to send invitation email:`, err);
    }

    return savedInvite;
  }

  //------------------------------------------------------------
  // ACCEPT INVITE (Transactional)
  //------------------------------------------------------------
  async acceptInvite(
    input: AcceptInviteInput,
    userId: string,
  ): Promise<{ membership: UserCompany; companyId: string; companySlug: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //------------------------------------------------------------
      // 1) USE SHARED VALIDATION METHOD (INSIDE TRANSACTION)
      //------------------------------------------------------------
      const invite = await this.validateInviteToken(input.token, queryRunner.manager);

      //------------------------------------------------------------
      // 2) VALIDATE USER
      //------------------------------------------------------------
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new BadRequestException(
          `This invitation was sent to ${invite.email}. Please sign in with that email to accept.`,
        );
      }

      //------------------------------------------------------------
      // 3) CHECK EXISTING MEMBERSHIP
      //------------------------------------------------------------
      const existing = await queryRunner.manager.findOne(UserCompany, {
        where: { user_id: userId, company_id: invite.company_id },
      });

      if (existing) {
        throw new ConflictException('User is already a member of this company');
      }

      //------------------------------------------------------------
      // 4) CREATE MEMBERSHIP
      //------------------------------------------------------------
      const membership = this.userCompanyRepository.create({
        user_id: userId,
        company_id: invite.company_id,
        role: invite.role.toUpperCase(),
        invited_by: invite.invited_by,
        status: 'active',
      });

      const savedMembership = await queryRunner.manager.save(membership);

      //------------------------------------------------------------
      // 5) ASSIGN WAREHOUSES
      //------------------------------------------------------------
      if (invite.warehouse_ids && invite.warehouse_ids.length > 0) {
        try {
          await this.userWarehouseService.assignUserToWarehouses(
            userId,
            invite.warehouse_ids,
            invite.manages_warehouse_ids || [],
            invite.invited_by,
            Role.OWNER, // Assuming inviter has permission (validated earlier)
          );
        } catch (error) {
          this.logger.error('Error assigning warehouses:', error);
          // Continue with invite acceptance even if warehouse assignment fails
        }
      }

      //------------------------------------------------------------
      // 6) UPDATE INVITE STATUS
      //------------------------------------------------------------
      invite.status = 'accepted';
      invite.accepted_at = new Date();
      await queryRunner.manager.save(invite);

      //------------------------------------------------------------
      // 7) COMMIT TRANSACTION
      //------------------------------------------------------------
      await queryRunner.commitTransaction();

      // UPDATE CLERK METADATA
      await this.clerkService.updateUserMetadata(userId, {
        activeCompanyId: invite.company_id,
        activeRole: invite.role.toUpperCase(),
      });

      return {
        membership: savedMembership,
        companyId: invite.company_id,
        companySlug: invite.company?.slug || '',
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error accepting invite:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  //------------------------------------------------------------
  // CANCEL INVITE
  //------------------------------------------------------------
  async cancelInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { invite_id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.invited_by !== userId) {
      throw new BadRequestException('Not authorized to cancel this invite');
    }

    invite.status = 'cancelled';
    await this.inviteRepository.save(invite);
  }

  //------------------------------------------------------------
  // GET INVITES FOR COMPANY
  //------------------------------------------------------------
  async getInvites(companyId: string): Promise<Invite[]> {
    return this.inviteRepository.find({
      where: { company_id: companyId, status: 'pending' },
      relations: ['company'],
      order: { created_at: 'DESC' },
    });
  }

  //------------------------------------------------------------
  // GET INVITES FOR USER (ONBOARDING)
  //------------------------------------------------------------
  async getInvitesByEmail(email: string): Promise<Invite[]> {
    const normalized = email.toLowerCase();
    return this.inviteRepository.find({
      where: { email: normalized, status: 'pending' },
      relations: ['company'],
      order: { created_at: 'DESC' },
    });
  }
}
