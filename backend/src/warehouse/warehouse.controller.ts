import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UserCompany } from '../user-company/user-company.entity';

@Controller('warehouses')
@UseGuards(AuthGuard)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
    @Req() req: any,
  ) {
    const companyId = req?.user?.activeCompanyId as string | undefined;
    const userId = req?.user?.id as string | undefined;

    if (!userId) {
      throw new BadRequestException('Invalid user');
    }

    if (!companyId) {
      throw new BadRequestException(
        'User does not have an active company selected',
      );
    }
    return this.warehouseService.create(createWarehouseDto, companyId, userId);
  }

  @Get()
  async findAll(@Req() req: any, @Query('companyId') queryCompanyId?: string) {
    const userId = req?.user?.id as string | undefined;
    if (!userId) {
      throw new BadRequestException('Invalid user');
    }

    // If an explicit companyId is provided, use it (for immediate company-switch fetches).
    // Otherwise fall back to the user's activeCompanyId.
    let companyId =
      queryCompanyId || (req?.user?.activeCompanyId as string | undefined);

    if (!companyId) {
      // If no activeCompanyId, try to get first company from user's companies
      const userCompanies = await this.userCompanyRepository.find({
        where: { user_id: userId },
      });

      if (userCompanies.length === 0) {
        throw new BadRequestException(
          'User is not associated with any company',
        );
      }

      // Use the first company
      companyId = userCompanies[0].company_id;
    }

    const userCompany = await this.userCompanyRepository.findOne({
      where: { user_id: userId, company_id: companyId },
    });

    if (!userCompany) {
      throw new BadRequestException('User not associated with company');
    }

    // Admin/Owner see all
    if (userCompany.role === Role.ADMIN || userCompany.role === Role.OWNER) {
      return this.warehouseService.findAll(companyId);
    }

    // Others see assigned (scoped to active/selected company)
    return this.warehouseService.findByUser(userId, companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehouseService.update(id, updateWarehouseDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async archive(@Param('id') id: string) {
    return this.warehouseService.archive(id);
  }

  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async assignUser(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('role') role?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.warehouseService.assignUser(id, userId, role);
  }

  @Delete(':id/users/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.warehouseService.removeUser(id, userId);
  }
}
