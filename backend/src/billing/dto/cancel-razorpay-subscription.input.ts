import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class CancelRazorpaySubscriptionInput {
  /**
   * Optional: if omitted, backend uses the most recent active subscription
   * for the user's active company.
   */
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  razorpaySubscriptionId?: string;
}
