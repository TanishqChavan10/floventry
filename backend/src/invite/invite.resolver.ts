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

@Resolver(() => Invite)
export class InviteResolver {
  constructor(private readonly inviteService: InviteService) { }

  @Mutation(() => Invite)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async sendInvite(
    @Args('input') input: SendInviteInput,
    @Context() context: any,
  ) {
    const companyId = '00000000-0000-0000-0000-000000000001'; // TODO: Get from context (using dummy UUID for type safety)
    const invitedBy = context.req.user.id;
    return this.inviteService.createInvite(input, companyId, invitedBy);
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
  @Roles(Role.ADMIN, Role.MANAGER)
  async cancelInvite(
    @Args('inviteId', { type: () => String }) inviteId: string,
    @Context() context: any,
  ) {
    const userId = context.req.user.id;
    await this.inviteService.cancelInvite(inviteId, userId);
    return true;
  }
}
