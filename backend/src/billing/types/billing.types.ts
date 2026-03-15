import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

registerEnumType(BillingInterval, {
  name: 'BillingInterval',
  description: 'Billing interval for subscription purchases',
});

@ObjectType()
export class RazorpayOrderPayload {
  @Field()
  orderId: string;

  @Field({ nullable: true })
  subscriptionId?: string;

  /** Amount in the smallest currency unit (paise). */
  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field()
  receipt: string;

  @Field()
  plan: string;

  @Field(() => BillingInterval)
  interval: BillingInterval;
}

@ObjectType()
export class VerifyPaymentResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  newPlan?: string;
}

@ObjectType()
export class SubscriptionActionResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  subscriptionId?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  cancelAtCycleEnd?: boolean;

  @Field({ nullable: true })
  currentEnd?: Date;

  @Field({ nullable: true })
  newPlan?: string;
}

@ObjectType()
export class RefundResult {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  refundId?: string;

  @Field({ nullable: true })
  status?: string;
}

@ObjectType()
export class BillingPaymentModel {
  @Field()
  id: string;

  @Field()
  companyId: string;

  @Field()
  plan: string;

  @Field(() => BillingInterval)
  interval: BillingInterval;

  @Field(() => Int)
  amount: number;

  @Field()
  currency: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  razorpayOrderId?: string;

  @Field({ nullable: true })
  razorpaySubscriptionId?: string;

  @Field({ nullable: true })
  razorpayPaymentId?: string;

  @Field({ nullable: true })
  razorpayInvoiceId?: string;

  @Field({ nullable: true })
  razorpayInvoiceUrl?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  paidAt?: Date;
}
