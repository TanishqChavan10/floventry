import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RestAuthGuard } from '../auth/guards/rest-auth.guard';
import { RestUser } from '../auth/decorators/rest-user.decorator';

@Controller('notifications')
@UseGuards(RestAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    findAll(@RestUser() user: any) {
        return this.notificationService.findAll(user.clerkId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @RestUser() user: any) {
        return this.notificationService.markAsRead(id, user.clerkId);
    }

    @Patch('read-all')
    markAllAsRead(@RestUser() user: any) {
        return this.notificationService.markAllAsRead(user.clerkId);
    }
}
