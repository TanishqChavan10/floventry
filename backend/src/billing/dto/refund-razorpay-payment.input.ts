import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class RefundRazorpayPaymentInput {
  @Field()
  @IsString()
  razorpayPaymentId: string;

  /** Amount in paise. If omitted, Razorpay will attempt a full refund. */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  amount?: number;
}
