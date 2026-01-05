import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class IssueNoteItemInput {
    @Field()
    @IsUUID()
    @IsNotEmpty()
    product_id: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    stock_lot_id?: string;

    @Field(() => Float)
    @Min(0.01)
    quantity: number;
}

@InputType()
export class CreateIssueNoteInput {
    @Field()
    @IsUUID()
    @IsNotEmpty()
    warehouse_id: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    sales_order_id?: string;

    @Field(() => [IssueNoteItemInput])
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IssueNoteItemInput)
    items: IssueNoteItemInput[];
}

@InputType()
export class UpdateIssueNoteInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    sales_order_id?: string;

    @Field(() => [IssueNoteItemInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IssueNoteItemInput)
    items?: IssueNoteItemInput[];
}
