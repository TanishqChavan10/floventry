import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InviteService } from './invite.service';
import { Invite } from './invite.model';
import { SendInviteInput } from './dto/send-invite.input';
import { AcceptInviteInput } from './dto/accept-invite.input';
import { UserCompany } from '../user-company/user-company.model';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { ClerkService } from '../auth/clerk.service';
import { BadRequestException } from '@nestjs/common';

@Resolver(() => Invite)
export class InviteResolver {
  constructor(
    private readonly inviteService: InviteService,
    private readonly clerkService: ClerkService,
  ) { }

  @Mutation(() => Invite)
  @UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
  async sendInvite(
    @Args('input') input: SendInviteInput,
    @Context() context: any,
  ) {
    const user = await this.clerkService.syncUser(context.req.user.clerkId);

    if (!user.activeCompanyId) {
      throw new BadRequestException('User does not have an active company selected');
    }

    return this.inviteService.createInvite(input, user.activeCompanyId, user.id);
  }

  @Mutation(() => UserCompany)
  async acceptInvite(
    @Args('input') input: AcceptInviteInput,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    return this.inviteService.acceptInvite(input, userId);
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER,Role.OWNER)
  async cancelInvite(
    @Args('inviteId', { type: () => String }) inviteId: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    await this.inviteService.cancelInvite(inviteId, userId);
    return true;
  }
}
