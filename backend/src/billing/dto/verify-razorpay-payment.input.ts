import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

@InputType()
export class VerifyRazorpayPaymentInput {
  @Field({ nullable: true })
  @IsString()
  @ValidateIf((o: VerifyRazorpayPaymentInput) => !o.razorpaySubscriptionId)
  @IsNotEmpty()
  razorpayOrderId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  razorpaySubscriptionId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
