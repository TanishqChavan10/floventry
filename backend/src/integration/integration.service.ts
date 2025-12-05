import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from './entities/integration.entity';

@Injectable()
export class IntegrationService {
    constructor(
        @InjectRepository(Integration)
        private integrationRepository: Repository<Integration>,
    ) { }

    async create(data: Partial<Integration>) {
        const integration = this.integrationRepository.create(data);
        return this.integrationRepository.save(integration);
    }

    async findAll(userId: string) {
        return this.integrationRepository.find({
            where: { userId },
            order: { name: 'ASC' },
        });
    }

    async toggle(id: string, userId: string, isEnabled: boolean) {
        await this.integrationRepository.update({ id, userId }, { isEnabled });
        return { success: true };
    }

    async updateConfig(id: string, userId: string, config: any) {
        await this.integrationRepository.update({ id, userId }, { config });
        return { success: true };
    }
}
