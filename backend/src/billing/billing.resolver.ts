import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRazorpayOrderInput } from './dto/create-razorpay-order.input';
import { VerifyRazorpayPaymentInput } from './dto/verify-razorpay-payment.input';
import { CancelRazorpaySubscriptionInput } from './dto/cancel-razorpay-subscription.input';
import { ChangeRazorpaySubscriptionPlanInput } from './dto/change-razorpay-subscription-plan.input';
import { RefundRazorpayPaymentInput } from './dto/refund-razorpay-payment.input';
import {
  BillingPaymentModel,
  RazorpayOrderPayload,
  RefundResult,
  SubscriptionActionResult,
  VerifyPaymentResult,
} from './types/billing.types';

@Resolver()
export class BillingResolver {
  constructor(private readonly billingService: BillingService) {}

  @Mutation(() => RazorpayOrderPayload)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async createRazorpayOrder(
    @Args('input') input: CreateRazorpayOrderInput,
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<RazorpayOrderPayload> {
    return this.billingService.createRazorpayOrder(user, input);
  }

  @Mutation(() => VerifyPaymentResult)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async verifyRazorpayPayment(
    @Args('input') input: VerifyRazorpayPaymentInput,
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<VerifyPaymentResult> {
    return this.billingService.verifyRazorpayPayment(user, input);
  }

  @Mutation(() => SubscriptionActionResult)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async cancelRazorpaySubscription(
    @Args('input') input: CancelRazorpaySubscriptionInput,
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<SubscriptionActionResult> {
    return this.billingService.cancelRazorpaySubscription(user, input);
  }

  @Mutation(() => SubscriptionActionResult)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async changeRazorpaySubscriptionPlan(
    @Args('input') input: ChangeRazorpaySubscriptionPlanInput,
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<SubscriptionActionResult> {
    return this.billingService.changeRazorpaySubscriptionPlan(user, input);
  }

  @Mutation(() => RefundResult)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  async refundRazorpayPayment(
    @Args('input') input: RefundRazorpayPaymentInput,
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<RefundResult> {
    return this.billingService.refundRazorpayPayment(user, input);
  }

  @Query(() => [BillingPaymentModel])
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async billingHistory(
    @CurrentUser() user: { id: string; role?: string; activeCompanyId?: string } | null,
  ): Promise<BillingPaymentModel[]> {
    const items = await this.billingService.getBillingHistory(user);

    return items.map((p) => ({
      id: p.id,
      companyId: p.company_id,
      plan: p.plan,
      interval: p.interval,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      razorpayOrderId: p.razorpay_order_id,
      razorpaySubscriptionId: p.razorpay_subscription_id,
      razorpayPaymentId: p.razorpay_payment_id,
      razorpayInvoiceId: p.razorpay_invoice_id,
      razorpayInvoiceUrl: p.razorpay_invoice_url,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    }));
  }
}
