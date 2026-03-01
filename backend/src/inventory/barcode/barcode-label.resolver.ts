import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { BarcodeLabelService } from './barcode-label.service';
import { GenerateBarcodeLabelsInput } from './dto/generate-barcode-labels.input';
import { BarcodeLabelResult } from './types/barcode-label.types';

@Resolver()
export class BarcodeLabelResolver {
  constructor(private readonly barcodeLabelService: BarcodeLabelService) {}

  @Mutation(() => BarcodeLabelResult)
  @UseGuards(AuthGuard)
  async generateBarcodeLabels(
    @Args('input') input: GenerateBarcodeLabelsInput,
    @CurrentUser() user: any,
  ): Promise<BarcodeLabelResult> {
    const companyId = user?.activeCompanyId;
    if (!companyId) {
      throw new BadRequestException(
        'User does not have an active company selected',
      );
    }

    const pdfBuffer = await this.barcodeLabelService.generateLabelsPdf({
      companyId,
      productIds: input.productIds,
      layout: input.layout,
    });

    // Convert buffer to base64
    const pdfData = pdfBuffer.toString('base64');

    return {
      pdfData,
      filename: 'barcode-labels.pdf',
      mimeType: 'application/pdf',
    };
  }
}
