import { Field, InputType } from '@nestjs/graphql';
import { IsIn } from 'class-validator';
import { BillingInterval } from '../types/billing.types';

@InputType()
export class CreateRazorpayOrderInput {
  @Field()
  @IsIn(['STANDARD', 'PRO'])
  plan: 'STANDARD' | 'PRO';

  @Field(() => BillingInterval)
  interval: BillingInterval;

  @Field({ nullable: true })
  idempotencyKey?: string;
}
