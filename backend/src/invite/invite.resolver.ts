import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite } from './invite.model';
import { SendInviteInput } from './dto/send-invite.input';
import { AcceptInviteInput } from './dto/accept-invite.input';
import { ValidateInviteResponse } from './dto/validate-invite-response';
import { UserCompany } from '../user-company/user-company.model';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { AuthService } from '../auth/auth.service';
import { BadRequestException } from '@nestjs/common';

@Resolver(() => Invite)
export class InviteResolver {
  constructor(
    private readonly inviteService: InviteService,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => Invite)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async sendInvite(
    @Args('input') input: SendInviteInput,
    @Context() context: any,
  ) {
    const user = await this.authService.syncUser(context.req.user.authId);
    const activeCompanyId = context.req.user.activeCompanyId; // Get from Supabase metadata

    if (!activeCompanyId) {
      throw new BadRequestException(
        'User does not have an active company selected',
      );
    }

    return this.inviteService.createInvite(input, activeCompanyId, user.id);
  }

  @Mutation(() => UserCompany)
  @UseGuards(AuthGuard)
  async acceptInvite(
    @Args('input') input: AcceptInviteInput,
    @Context() context: any,
  ) {
    const user = await this.authService.syncUser(context.req.user.authId);
    const result = await this.inviteService.acceptInvite(input, user.id);
    return result.membership;
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async cancelInvite(
    @Args('inviteId', { type: () => String }) inviteId: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    await this.inviteService.cancelInvite(inviteId, userId);
    return true;
  }

  //------------------------------------------------------------
  // QUERIES
  //------------------------------------------------------------

  @Query(() => ValidateInviteResponse)
  async validateInvite(@Args('token', { type: () => String }) token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    const invite = await this.inviteService.validateInviteToken(token);
    const userExists = await this.inviteService.checkEmailHasAccount(invite.email);
    return {
      email: invite.email,
      companyName: invite.company?.name || 'Unknown Company',
      companySlug: invite.company?.slug,
      role: invite.role,
      companyId: invite.company_id,
      status: invite.status,
      userExists,
    };
  }

  @Query(() => [Invite])
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async companyInvites(
    @Args('companyId', { type: () => String }) companyId: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.inviteService.getInvitesForMember(companyId, userId);
  }

  @Query(() => [Invite])
  @UseGuards(AuthGuard)
  async myPendingInvites(@Context() context: any) {
    if (!context.req.user?.authId) {
      return [];
    }
    const user = await this.authService.getUserById(
      context.req.user.authId,
    );
    if (!user || !user.email) {
      return [];
    }
    return this.inviteService.getInvitesByEmail(user.email);
  }
}
