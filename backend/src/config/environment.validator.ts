import { ConfigService } from '@nestjs/config';
import { validateEnvironment } from './env.schema';

/**
 * Environment Configuration Validator
 * This utility validates environment variables using Joi schema
 */
export class EnvironmentValidator {
  constructor(private configService: ConfigService) {}

  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Get all environment variables
    const envVars = this.configService.get<Record<string, any>>('');

    // Validate using Joi schema
    const { error } = validateEnvironment(envVars || {});

    if (error) {
      // Extract error messages from Joi validation
      errors.push(...error.details.map((detail) => detail.message));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  logConfiguration(): void {
    console.log('🔧 Environment Configuration:');
    console.log(
      `   NODE_ENV: ${this.configService.get('NODE_ENV', 'development')}`,
    );
    console.log(`   PORT: ${this.configService.get('PORT', 5000)}`);
    console.log(
      `   DATABASE_URL: ${this.configService.get('DATABASE_URL') ? '***SET***' : '***NOT SET***'}`,
    );
    console.log(
      `   GRAPHQL_PATH: ${this.configService.get('GRAPHQL_PATH', '/api/graphql')}`,
    );
    console.log(
      `   CORS_ORIGIN: ${this.configService.get('CORS_ORIGIN', 'http://localhost:3000')}`,
    );

    // Don't log sensitive information
    console.log(
      `   JWT_SECRET: ${this.configService.get('JWT_SECRET') ? '***SET***' : '***NOT SET***'}`,
    );
  }
}
