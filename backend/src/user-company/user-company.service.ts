import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCompany } from './user-company.entity';
import { UpdateRoleInput } from './dto/update-role.input';

@Injectable()
export class UserCompanyService {
  constructor(
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
  ) { }

  async listUsersInCompany(companyId: string): Promise<UserCompany[]> {
    return this.userCompanyRepository.find({
      where: { company_id: companyId, status: 'active' },
      order: { joined_at: 'ASC' },
    });
  }

  async changeRole(input: UpdateRoleInput, requestingUserId: string): Promise<UserCompany> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: input.membership_id },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Verify requesting user has permission (is owner or admin)
    const requestingMembership = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    if (!requestingMembership) {
      throw new BadRequestException('Requesting user is not a member of this company');
    }

    // TODO: Permission check: Ensure requester has higher role than target, and can assign target role.

    membership.role = input.role;
    return this.userCompanyRepository.save(membership);
  }

  async removeUser(membershipId: string, requestingUserId: string): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: { membership_id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Verify requesting user has permission
    const requestingMembership = await this.userCompanyRepository.findOne({
      where: { user_id: requestingUserId, company_id: membership.company_id },
    });

    if (!requestingMembership) {
      throw new BadRequestException('Requesting user is not a member of this company');
    }

    // Cannot remove yourself
    if (membership.user_id === requestingUserId) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    membership.status = 'inactive';
    await this.userCompanyRepository.save(membership);
  }

  async getMembership(userId: string, companyId: string): Promise<UserCompany | null> {
    return this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: companyId, status: 'active' },
      relations: ['company'],
    });
  }
}
