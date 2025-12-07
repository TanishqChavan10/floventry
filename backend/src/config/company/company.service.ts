import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CompanySettings } from './company-settings.entity';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanySettingsInput } from './dto/update-company-settings.input';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(CompanySettings)
    private settingsRepository: Repository<CompanySettings>,
  ) {}

  async createCompany(input: CreateCompanyInput, ownerId: string): Promise<Company> {
    // Check if company name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { name: input.name },
    });

    if (existingCompany) {
      throw new BadRequestException('Company name already exists');
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

    return savedCompany;
  }

  async updateSettings(companyId: string, input: UpdateCompanySettingsInput): Promise<CompanySettings> {
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
      relations: ['settings'],
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
    const membership = await this.companyRepository
      .createQueryBuilder('company')
      .innerJoin('user_companies', 'uc', 'uc.company_id = company.id')
      .where('uc.user_id = :userId', { userId })
      .andWhere('uc.company_id = :companyId', { companyId })
      .andWhere('uc.status = :status', { status: 'active' })
      .getOne();

    if (!membership) {
      throw new BadRequestException('User is not a member of this company');
    }

    return this.getCompanyById(companyId);
  }
}
