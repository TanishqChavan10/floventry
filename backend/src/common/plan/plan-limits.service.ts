import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySettings } from '../../company/company-settings.entity';

export type ResourceType = 'product' | 'warehouse' | 'member' | 'supplier';
export type Plan = 'FREE' | 'STANDARD' | 'PRO';

export const PLAN_LIMITS: Record<Plan, Record<ResourceType, number>> = {
  FREE: { product: 100, warehouse: 1, member: 2, supplier: 10 },
  STANDARD: { product: 500, warehouse: 3, member: 5, supplier: 50 },
  PRO: { product: Infinity, warehouse: Infinity, member: Infinity, supplier: Infinity },
};

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectRepository(CompanySettings)
    private readonly settingsRepository: Repository<CompanySettings>,
  ) {}

  /**
   * Throws if creating another resource would exceed the company's plan limit.
   * @param resource - The resource type to check
   * @param companyId - The company ID
   * @param currentCount - How many of this resource the company currently has
   */
  async assertCanCreate(
    resource: ResourceType,
    companyId: string,
    currentCount: number,
  ): Promise<void> {
    const settings = await this.settingsRepository.findOne({
      where: { company_id: companyId },
    });

    if (!settings) {
      throw new NotFoundException('Company settings not found');
    }

    const plan = settings.plan;
    const limits = PLAN_LIMITS[plan];

    if (!limits) {
      throw new BadRequestException(`Unknown plan: ${plan}`);
    }

    if (plan === 'PRO') return;

    const limit = limits[resource];

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `${resource.charAt(0).toUpperCase() + resource.slice(1)} limit reached for your plan`,
      );
    }
  }
}
