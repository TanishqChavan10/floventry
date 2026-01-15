import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Test database configuration
 * Uses PostgreSQL ONLY - no SQLite to ensure production parity
 */
export const testDatabaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres',
    database: process.env.TEST_DB_NAME || 'floventry_test',

    // Auto-discover entities
    entities: ['src/**/*.entity.ts'],

    // Clean slate for every test run
    synchronize: true,
    dropSchema: true, // Critical: ensures isolated test environment

    // Disable logging for cleaner test output
    logging: false,

    // Connection pool settings
    extra: {
        max: 5, // Smaller pool for tests
    },
};
