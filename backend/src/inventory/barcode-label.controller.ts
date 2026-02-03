import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { GenerateBarcodeLabelsDto } from './dto/generate-barcode-labels.dto';
import { BarcodeLabelService } from './barcode-label.service';

@Controller('barcode-labels')
@UseGuards(ClerkAuthGuard)
export class BarcodeLabelController {
  constructor(private readonly barcodeLabelService: BarcodeLabelService) {}

  @Post()
  async generateLabels(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: GenerateBarcodeLabelsDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const companyId = req?.user?.activeCompanyId;
    if (!companyId) {
      throw new BadRequestException(
        'User does not have an active company selected',
      );
    }

    const pdf = await this.barcodeLabelService.generateLabelsPdf({
      companyId,
      productIds: body.productIds,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="barcode-labels.pdf"',
    );
    res.setHeader('Content-Length', pdf.length);

    return res.send(pdf);
  }
}
