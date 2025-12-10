import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invite } from './invite.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { SendInviteInput } from './dto/send-invite.input';
import { AcceptInviteInput } from './dto/accept-invite.input';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Invite)
    private inviteRepository: Repository<Invite>,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async createInvite(input: SendInviteInput, companyId: string, invitedBy: string): Promise<Invite> {
    const email = input.email.toLowerCase(); // Ensure lowercase

    console.log('Creating invite with data:', { email, companyId, role: input.role, invitedBy });

    // Check if invite already exists for this email
    const existingInvite = await this.inviteRepository.findOne({
      where: { email, company_id: companyId, status: 'pending' },
    });

    if (existingInvite) {
      console.log('Invite already exists for this email');
      throw new ConflictException('Invite already sent to this email');
    }

    // Create invite
    const invite = this.inviteRepository.create({
      email,
      company_id: companyId,
      role: input.role,
      invited_by: invitedBy,
      token: uuidv4(),
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    });

    try {
      const savedInvite = await this.inviteRepository.save(invite);
      console.log('Invite saved successfully:', savedInvite);
      return savedInvite;
    } catch (error) {
      console.error('Error saving invite:', error);
      throw error;
    }
  }

  async validateInviteToken(token: string): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { token, status: 'pending' },
      relations: ['company'],
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite');
    }

    if (invite.expires_at < new Date()) {
      invite.status = 'expired';
      await this.inviteRepository.save(invite);
      throw new BadRequestException('Invite has expired');
    }

    return invite;
  }

  async acceptInvite(input: AcceptInviteInput, userId: string): Promise<UserCompany> {
    const invite = await this.validateInviteToken(input.token);

    // Fetch user to check email match
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new BadRequestException(`This invitation was sent to ${invite.email}. Please sign in with that email to accept.`);
    }

    // Check if user is already a member
    const existingMembership = await this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: invite.company_id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this company');
    }

    // Create membership
    const membership = this.userCompanyRepository.create({
      user_id: userId,
      company_id: invite.company_id,
      role: invite.role as unknown as string,
      invited_by: invite.invited_by,
      status: 'active',
    });

    const savedMembership = await this.userCompanyRepository.save(membership);

    // Update invite
    invite.status = 'accepted';
    invite.accepted_at = new Date();
    await this.inviteRepository.save(invite);

    return savedMembership;
  }

  async cancelInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { invite_id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Check if user can cancel (owner or invited_by)
    if (invite.invited_by !== userId) {
      // TODO: Check if user is company owner (when we have full RBAC/owner check accessible here easily or via context)
      throw new BadRequestException('Not authorized to cancel this invite');
    }

    invite.status = 'cancelled';
    await this.inviteRepository.save(invite);
  }

  async getInvites(companyId: string): Promise<Invite[]> {
    return this.inviteRepository.find({
      where: { company_id: companyId, status: 'pending' },
      order: { created_at: 'DESC' },
    });
  }

  async getInvitesByEmail(email: string): Promise<Invite[]> {
    console.log(`Checking pending invites for email: ${email}`);
    const normalizedEmail = email.toLowerCase();

    const invites = await this.inviteRepository.find({
      where: { email: normalizedEmail, status: 'pending' },
      relations: ['company'],
      order: { created_at: 'DESC' },
    });

    console.log(`Found ${invites.length} invites for ${normalizedEmail}`);
    return invites;
  }
}
