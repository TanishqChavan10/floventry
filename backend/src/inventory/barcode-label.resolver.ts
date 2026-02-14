import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { ClerkUser } from '../auth/decorators/clerk-user.decorator';
import { BarcodeLabelService } from './barcode-label.service';
import { GenerateBarcodeLabelsInput } from './dto/generate-barcode-labels.input';
import { BarcodeLabelResult } from './types/barcode-label.types';

@Resolver()
export class BarcodeLabelResolver {
  constructor(private readonly barcodeLabelService: BarcodeLabelService) {}

  @Mutation(() => BarcodeLabelResult)
  @UseGuards(ClerkAuthGuard)
  async generateBarcodeLabels(
    @Args('input') input: GenerateBarcodeLabelsInput,
    @ClerkUser() user: any,
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
