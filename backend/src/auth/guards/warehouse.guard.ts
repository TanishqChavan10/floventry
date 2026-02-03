import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWarehouse } from '../entities/user-warehouse.entity';
import { Role } from '../enums/role.enum';

@Injectable()
export class WarehouseGuard implements CanActivate {
  constructor(
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // OWNER and ADMIN have full access to all warehouses
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      return true;
    }

    // Extract warehouse ID from args
    const args = ctx.getArgs();
    const warehouseId =
      args.warehouseId || args.input?.warehouse_id || args.input?.warehouseId;

    if (!warehouseId) {
      // If no warehouse ID specified, let the resolver handle it
      return true;
    }

    // Check if user has access to this warehouse
    const userWarehouse = await this.userWarehouseRepository.findOne({
      where: {
        user_id: user.userId,
        warehouse_id: warehouseId,
      },
    });

    if (!userWarehouse) {
      throw new ForbiddenException('You do not have access to this warehouse');
    }

    // Attach warehouse access info to request for later use
    request.warehouseAccess = {
      hasAccess: true,
      isManager: userWarehouse.is_manager_of_warehouse,
    };

    return true;
  }
}
