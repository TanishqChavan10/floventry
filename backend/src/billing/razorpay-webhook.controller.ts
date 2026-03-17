import {
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('webhooks/razorpay')
export class RazorpayWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-event-id') eventId?: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      // Should not happen if rawBody support is enabled.
      throw new ForbiddenException('Missing raw body');
    }

    await this.billingService.handleRazorpayWebhook({
      signature,
      rawBody,
      eventId,
      body: req.body,
    });

    // Always return 200 for valid signed requests; Razorpay retries on non-2xx.
    return { received: true };
  }
}
