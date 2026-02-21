import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Force Node.js to treat all timestamps as UTC so TypeORM/GraphQL
// serialise dates correctly regardless of the host's system timezone.
process.env.TZ = 'UTC';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN!.split(','),
    credentials: true,
  });

  await app.listen(configService.get<number>('PORT') ?? 5000);
}
bootstrap();
