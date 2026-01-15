import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INestApplication } from '@nestjs/common';
import { testDatabaseConfig } from '../test-config';

/**
 * Creates a NestJS testing module with database connection
 * Uses dropSchema: true for clean state between test files
 */
export async function createTestingModule(
    imports: any[],
): Promise<{ module: TestingModule; app: INestApplication }> {
    const module = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot(testDatabaseConfig),
            ...imports,
        ],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    return { module, app };
}

/**
 * Cleanup helper for test teardown
 */
export async function cleanupTestModule(app: INestApplication): Promise<void> {
    if (app) {
        await app.close();
    }
}
