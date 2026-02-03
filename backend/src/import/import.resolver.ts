import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import {
  ImportService,
  ValidationResult,
  ImportResult,
} from './import.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';

@Resolver()
export class ImportResolver {
  constructor(private readonly importService: ImportService) {}

  // Template Downloads
  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async downloadProductTemplate(): Promise<string> {
    return this.importService.generateProductTemplate();
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async downloadCategoryTemplate(): Promise<string> {
    return this.importService.generateCategoryTemplate();
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async downloadSupplierTemplate(): Promise<string> {
    return this.importService.generateSupplierTemplate();
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async downloadOpeningStockTemplate(): Promise<string> {
    return this.importService.generateOpeningStockTemplate();
  }

  // Validation
  @Mutation(() => String) // Returns JSON string
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async validateProductImport(
    @Args('csvContent') csvContent: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const result = await this.importService.validateProductImport(
      csvContent,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async validateCategoryImport(
    @Args('csvContent') csvContent: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const result = await this.importService.validateCategoryImport(
      csvContent,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async validateSupplierImport(
    @Args('csvContent') csvContent: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const result = await this.importService.validateSupplierImport(
      csvContent,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async validateOpeningStockImport(
    @Args('csvContent') csvContent: string,
    @Args('warehouseId') warehouseId: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const result = await this.importService.validateOpeningStockImport(
      csvContent,
      warehouseId,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  // Execution
  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async executeProductImport(
    @Args('validatedData') validatedData: string, // JSON string
    @ClerkUser() user: any,
  ): Promise<string> {
    const data = JSON.parse(validatedData);
    const result = await this.importService.executeProductImport(
      data,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async executeCategoryImport(
    @Args('validatedData') validatedData: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const data = JSON.parse(validatedData);
    const result = await this.importService.executeCategoryImport(
      data,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async executeSupplierImport(
    @Args('validatedData') validatedData: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const data = JSON.parse(validatedData);
    const result = await this.importService.executeSupplierImport(
      data,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.MANAGER)
  async executeOpeningStockImport(
    @Args('validatedData') validatedData: string,
    @Args('warehouseId') warehouseId: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const data = JSON.parse(validatedData);
    const result = await this.importService.executeOpeningStockImport(
      data,
      warehouseId,
      user.activeCompanyId,
      user.id,
    );
    return JSON.stringify(result);
  }

  // Units Import
  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async downloadUnitTemplate(): Promise<string> {
    return this.importService.generateUnitTemplate();
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async validateUnitImport(
    @Args('csvContent') csvContent: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const result = await this.importService.validateUnitImport(
      csvContent,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async executeUnitImport(
    @Args('validatedData') validatedData: string,
    @ClerkUser() user: any,
  ): Promise<string> {
    const data = JSON.parse(validatedData);
    const result = await this.importService.executeUnitImport(
      data,
      user.activeCompanyId,
    );
    return JSON.stringify(result);
  }
}
