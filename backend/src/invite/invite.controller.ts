import { Controller, Post, Get, Body, Query, UseGuards, Req, BadRequestException, Param } from '@nestjs/common';
import { InviteService } from './invite.service';
import { SendInviteInput } from './dto/send-invite.input';
import { AcceptInviteInput } from './dto/accept-invite.input';
import { Role } from '../auth/enums/role.enum';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkService } from '../auth/clerk.service';

@Controller('invites')
export class InviteController {
    constructor(
        private readonly inviteService: InviteService,
        private readonly clerkService: ClerkService,
    ) { }

    @Get('test')
    test() {
        return "Invite controller is reachable";
    }

    @Post('send')
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
    async sendInvite(@Body() body: SendInviteInput, @Req() req: any) {
        const user = await this.clerkService.syncUser(req.user.clerkId);

        if (!user.activeCompanyId) {
            throw new BadRequestException('User does not have an active company selected');
        }

        return this.inviteService.createInvite(body, user.activeCompanyId, user.id);
    }

    @Get('validate')
    async validateInvite(@Query('token') token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }
        const invite = await this.inviteService.validateInviteToken(token);
        // Explicitly returning minimal info required by frontend logic from user request
        return {
            email: invite.email,
            companyName: invite.company?.name || 'Unknown Company',
            companySlug: invite.company?.slug,
            role: invite.role,
            companyId: invite.company_id,
        };
    }

    @Post('accept')
    @UseGuards(ClerkAuthGuard)
    async acceptInvite(@Body() body: AcceptInviteInput, @Req() req: any) {
        const user = await this.clerkService.syncUser(req.user.clerkId);
        const result = await this.inviteService.acceptInvite(body, user.id);

        // Return company info for frontend redirect
        return {
            membership: result.membership,
            companyId: result.companyId,
            companySlug: result.companySlug,
        };
    }

    @Get('company/:companyId')
    @UseGuards(ClerkAuthGuard, RolesGuard)
    @Roles(Role.ADMIN, Role.MANAGER, Role.OWNER)
    async getInvites(@Param('companyId') companyId: string) {
        return this.inviteService.getInvites(companyId);
    }

    @Get('my-pending')
    @UseGuards(ClerkAuthGuard)
    async getMyPendingInvites(@Req() req: any) {
        if (!req.user?.clerkId) {
            return [];
        }
        const user = await this.clerkService.getUserByClerkId(req.user.clerkId);
        if (!user || !user.email) {
            return [];
        }
        return this.inviteService.getInvitesByEmail(user.email);
    }
}
