import {
  BadRequestException,
  Body,
  Controller,
  Header,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { BarcodeThermalLabelService, type ThermalLabelSize } from './barcode-thermal-label.service';

class GenerateThermalZplDto {
  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  copies?: number;

  @IsOptional()
  @IsIn(['2x1', '50x25mm', '4x6'])
  labelSize?: ThermalLabelSize;
}

@Controller('thermal/labels')
@UseGuards(ClerkAuthGuard)
export class ThermalLabelController {
  constructor(private readonly thermal: BarcodeThermalLabelService) {}

  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Post('zpl')
  async generateZpl(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: GenerateThermalZplDto,
    @Req() req: any,
  ) {
    const companyId = req?.user?.activeCompanyId;
    if (!companyId) {
      throw new BadRequestException('Active company required');
    }

    const zpl = await this.thermal.generateZpl({
      companyId,
      productIds: body.productIds,
      copies: body.copies ?? 1,
      labelSize: (body.labelSize ?? '2x1') as ThermalLabelSize,
    });

    return zpl;
  }
}
