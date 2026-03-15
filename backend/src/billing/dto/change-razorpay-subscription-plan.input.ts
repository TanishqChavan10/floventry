import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString } from 'class-validator';

@InputType()
export class ChangeRazorpaySubscriptionPlanInput {
  /**
   * Optional: if omitted, backend uses the most recent active subscription
   * for the user's active company.
   */
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  razorpaySubscriptionId?: string;

  @Field()
  @IsIn(['STANDARD', 'PRO'])
  newPlan: 'STANDARD' | 'PRO';
}
