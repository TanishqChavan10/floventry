import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { RestUser } from '../auth/decorators/rest-user.decorator';

@Controller('integrations')
@UseGuards(RestAuthGuard)
export class IntegrationController {
    constructor(private readonly integrationService: IntegrationService) { }

    @Get()
    findAll(@RestUser() user: any) {
        return this.integrationService.findAll(user.clerkId);
    }

    @Post()
    create(@Body() body: any, @RestUser() user: any) {
        return this.integrationService.create({ ...body, userId: user.clerkId });
    }

    @Patch(':id/toggle')
    toggle(
        @Param('id') id: string,
        @Body('isEnabled') isEnabled: boolean,
        @RestUser() user: any,
    ) {
        return this.integrationService.toggle(id, user.clerkId, isEnabled);
    }

    @Patch(':id/config')
    updateConfig(
        @Param('id') id: string,
        @Body('config') config: any,
        @RestUser() user: any,
    ) {
        return this.integrationService.updateConfig(id, user.clerkId, config);
    }
}
