import { Resolver, Query, Mutation, Subscription, Args, Int } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CursorPaginationInput } from '../common/dto/pagination.types';
import { NotificationConnection } from '../common/dto/connections';
import { PUB_SUB } from '../common/pubsub/pubsub.module';

@Resolver(() => Notification)
@UseGuards(AuthGuard)
export class NotificationsResolver {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(PUB_SUB) private pubSub: PubSub,
  ) {}

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

  @Query(() => NotificationConnection, { name: 'notificationsConnection' })
  async notificationsConnection(
    @CurrentUser() user: any,
    @Args('pagination', { nullable: true }) pagination: CursorPaginationInput,
  ) {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.notificationsService.getForUserConnection(user.id, pagination);
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

  @Subscription(() => Notification, {
    description: 'Listen for new notifications for the current user',
    filter: (payload, _variables, context) => {
      // Only deliver to the user who owns the notification
      return payload.notificationCreated.user_id === context?.req?.user?.id;
    },
    resolve: (payload) => payload.notificationCreated,
  })
  notificationCreated(@CurrentUser() user: any) {
    if (!user || !user.id) {
      throw new Error('Unauthorized');
    }
    return this.pubSub.asyncIterableIterator(`notificationCreated:${user.id}`);
  }
}
