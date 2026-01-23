import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class BarcodeLabelResult {
    @Field()
    pdfData: string; // Base64-encoded PDF

    @Field()
    filename: string;

    @Field()
    mimeType: string;
}
