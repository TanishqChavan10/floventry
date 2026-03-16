import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Used by the frontend to wait out Render/Railway/etc. cold-starts.
  // With `app.setGlobalPrefix('api')`, this becomes `GET /api/health`.
  @Get('health')
  health() {
    return { ok: true, timestamp: new Date().toISOString() };
  }
}
