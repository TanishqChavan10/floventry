import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkService } from '../auth/clerk.service';
import { UserCompany } from '../user-company/user-company.entity';

@Controller('warehouses')
@UseGuards(ClerkAuthGuard)
export class WarehouseController {
    constructor(
        private readonly warehouseService: WarehouseService,
        private readonly clerkService: ClerkService,
        @InjectRepository(UserCompany)
        private userCompanyRepository: Repository<UserCompany>,
    ) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async create(@Body() createWarehouseDto: CreateWarehouseDto, @Req() req: any) {
        const user = await this.clerkService.syncUser(req.user.clerkId);
        if (!user.activeCompanyId) {
            throw new BadRequestException('User does not have an active company selected');
        }
        return this.warehouseService.create(createWarehouseDto, user.activeCompanyId, user.id);
    }

    @Get()
    async findAll(@Req() req: any) {
        const user = await this.clerkService.syncUser(req.user.clerkId);

        // Get company ID from user's activeCompanyId or first company
        let companyId = user.activeCompanyId;

        if (!companyId) {
            // If no activeCompanyId, try to get first company from user's companies
            const userCompanies = await this.userCompanyRepository.find({
                where: { user_id: user.id },
            });

            if (userCompanies.length === 0) {
                throw new BadRequestException('User is not associated with any company');
            }

            // Use the first company
            companyId = userCompanies[0].company_id;
        }

        const userCompany = await this.userCompanyRepository.findOne({
            where: { user_id: user.id, company_id: companyId },
        });

        if (!userCompany) {
            throw new BadRequestException('User not associated with company');
        }

        // Admin/Owner see all
        if (userCompany.role === Role.ADMIN || userCompany.role === Role.OWNER) {
            return this.warehouseService.findAll(companyId);
        }

        // Others see assigned (scoped to active/selected company)
        return this.warehouseService.findByUser(user.id, companyId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.warehouseService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
        return this.warehouseService.update(id, updateWarehouseDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.OWNER, Role.ADMIN)
    async remove(@Param('id') id: string) {
        return this.warehouseService.remove(id);
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
