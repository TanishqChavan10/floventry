import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CompanySettings } from './company-settings.entity';
import { CompanyStats } from './company-stats.model';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanySettingsInput } from './dto/update-company-settings.input';
import { UpdateCompanyBarcodeSettingsInput } from './dto/update-company-barcode-settings.input';
import { User } from '../auth/entities/user.entity';
import { UserCompany } from '../user-company/user-company.entity';
import { UserWarehouse } from '../auth/entities/user-warehouse.entity';
import { Warehouse } from '../warehouse/warehouse.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { Product } from '../inventory/entities/product.entity';
import { Role } from '../auth/enums/role.enum';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(CompanySettings)
    private settingsRepository: Repository<CompanySettings>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCompany)
    private userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(UserWarehouse)
    private userWarehouseRepository: Repository<UserWarehouse>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private authService: AuthService,
  ) {}

  async createCompany(
    input: CreateCompanyInput,
    ownerId: string,
  ): Promise<Company> {
    // Check if company name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { name: input.name },
    });

    if (existingCompany) {
      throw new BadRequestException('Company name already exists');
    }

    // Check if slug already exists
    const existingSlug = await this.companyRepository.findOne({
      where: { slug: input.slug },
    });

    if (existingSlug) {
      throw new BadRequestException('Workspace URL is already taken');
    }

    // Create company
    const company = this.companyRepository.create({
      ...input,
      created_by: ownerId,
    });

    const savedCompany = await this.companyRepository.save(company);

    // Create default settings
    const settings = this.settingsRepository.create({
      company_id: savedCompany.id,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      stock_costing_method: 'FIFO',
      low_stock_threshold: 10,
      allow_negative_stock: false,
    });

    await this.settingsRepository.save(settings);

    // Create user-company relationship with owner role
    const userCompany = this.userCompanyRepository.create({
      user_id: ownerId,
      company_id: savedCompany.id,
      role: Role.OWNER,
      status: 'active',
    });

    await this.userCompanyRepository.save(userCompany);

    // Set as active company for the user
    await this.userRepository.update(
      { id: ownerId },
      { activeCompanyId: savedCompany.id },
    );

    // UPDATE Supabase METADATA
    await this.authService.updateUserMetadata(ownerId, {
      activeCompanyId: savedCompany.id,
      activeRole: Role.OWNER,
    });

    return savedCompany;
  }

  async updateSettings(
    companyId: string,
    input: UpdateCompanySettingsInput,
  ): Promise<CompanySettings> {
    const settings = await this.settingsRepository.findOne({
      where: { company_id: companyId },
    });

    if (!settings) {
      throw new NotFoundException('Company settings not found');
    }

    Object.assign(settings, input);

    return this.settingsRepository.save(settings);
  }

  async getCompanyById(companyId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['settings', 'warehouses'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async getCompaniesByUser(userId: string): Promise<Company[]> {
    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .innerJoin('user_companies', 'uc', 'uc.company_id = company.id')
      .where('uc.user_id = :userId', { userId })
      .andWhere('uc.status = :status', { status: 'active' })
      .leftJoinAndSelect('company.settings', 'settings')
      .getMany();

    return companies;
  }

  async switchCompany(userId: string, companyId: string): Promise<Company> {
    // Verify user is member of the company
    // Verify user is member of the company
    const membership = await this.userCompanyRepository.findOne({
      where: {
        user_id: userId,
        company_id: companyId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new BadRequestException('User is not a member of this company');
    }

    await this.userRepository.update(
      { id: userId },
      { activeCompanyId: companyId },
    );

    // UPDATE Supabase METADATA
    await this.authService.updateUserMetadata(userId, {
      activeCompanyId: companyId,
      activeRole: membership.role.toUpperCase(),
    });

    return this.getCompanyById(companyId);
  }

  /**
   * Enforces that the user is an active member of the given company.
   * This should be used by resolvers that accept a companyId/slug argument.
   */
  async assertActiveMembership(userId: string, companyId: string): Promise<void> {
    const membership = await this.userCompanyRepository.findOne({
      where: {
        user_id: userId,
        company_id: companyId,
        status: 'active',
      },
      select: ['membership_id'],
    });

    if (!membership) {
      throw new ForbiddenException('Forbidden: not a member of this company');
    }
  }

  async getCompanyBySlug(slug: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { slug: slug },
      relations: ['settings'],
      withDeleted: true,
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Load warehouses including soft-deleted ones (archived)
    company.warehouses = await this.warehouseRepository.find({
      where: { company_id: company.id },
      withDeleted: true,
    });

    return company;
  }

  async updateCompany(companyId: string, input: any): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    Object.assign(company, input);
    return this.companyRepository.save(company);
  }

  async updateBarcodeSettings(
    companyId: string,
    input: UpdateCompanyBarcodeSettingsInput,
    user: { role?: string } | null,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const prefix = (input.barcodePrefix ?? '').trim();
    const suffix = (input.barcodeSuffix ?? '').trim();
    const padding = input.barcodePadding;

    if (!prefix) {
      throw new BadRequestException('barcodePrefix is required');
    }
    if (/\s/.test(prefix)) {
      throw new BadRequestException('barcodePrefix cannot contain spaces');
    }
    if (prefix.length > 20) {
      throw new BadRequestException('barcodePrefix must be at most 20 characters');
    }
    if (suffix.length > 20) {
      throw new BadRequestException('barcodeSuffix must be at most 20 characters');
    }
    if (!Number.isInteger(padding) || padding < 3 || padding > 10) {
      throw new BadRequestException('barcodePadding must be between 3 and 10');
    }

    company.barcode_prefix = prefix;
    company.barcode_padding = padding;
    company.barcode_suffix = suffix;

    const role = typeof user?.role === 'string' ? user.role.toUpperCase() : '';
    const isPrivileged = role === Role.ADMIN || role === Role.OWNER;

    if (input.barcodeNextNumber !== undefined) {
      if (!isPrivileged) {
        throw new BadRequestException('Not allowed to update barcodeNextNumber');
      }

      const next = input.barcodeNextNumber;
      if (!Number.isFinite(next) || next < 1) {
        throw new BadRequestException('barcodeNextNumber must be >= 1');
      }
      if (!Number.isInteger(next)) {
        throw new BadRequestException('barcodeNextNumber must be an integer');
      }
      if (next > Number.MAX_SAFE_INTEGER) {
        throw new BadRequestException('barcodeNextNumber is too large');
      }

      company.barcode_next_number = BigInt(next).toString();
    }

    return this.companyRepository.save(company);
  }

  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    // Get all warehouses for this company
    const warehouses = await this.warehouseRepository.find({
      where: { company_id: companyId },
      select: ['id'],
    });

    const warehouseIds = warehouses.map((w) => w.id);

    // Count total staff (distinct users assigned to any warehouse in this company)
    let totalStaff = 0;
    if (warehouseIds.length > 0) {
      const result = await this.userWarehouseRepository
        .createQueryBuilder('uw')
        .select('COUNT(DISTINCT uw.user_id)', 'count')
        .where('uw.warehouse_id IN (:...warehouseIds)', { warehouseIds })
        .getRawOne();
      totalStaff = parseInt(result?.count || '0', 10);
    }

    // Calculate total inventory value (sum of cost_price * quantity across all warehouses)
    let totalInventoryValue = 0;
    if (warehouseIds.length > 0) {
      const result = await this.stockRepository
        .createQueryBuilder('stock')
        .innerJoin('stock.product', 'product')
        .select('SUM(product.cost_price * stock.quantity)', 'totalValue')
        .where('stock.warehouse_id IN (:...warehouseIds)', { warehouseIds })
        .andWhere('product.cost_price IS NOT NULL')
        .getRawOne();
      totalInventoryValue = parseFloat(result?.totalValue || '0');
    }

    return {
      totalStaff,
      totalInventoryValue,
    };
  }
}
