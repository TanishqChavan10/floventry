import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver(() => Notification)
@UseGuards(AuthGuard)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification])
  async notifications(
    @CurrentUser() user: any,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<Notification[]> {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.getForUser(user.id, limit, offset);
  }

  @Query(() => Int)
  async unreadNotificationCount(@CurrentUser() user: any): Promise<number> {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Mutation(() => Notification)
  async markNotificationAsRead(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markAsReadForUser(id, user.id);
  }

  @Mutation(() => Int)
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<number> {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.markAllAsRead(user.id);
  }
}
