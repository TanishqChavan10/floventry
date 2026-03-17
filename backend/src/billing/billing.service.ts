import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IsNull, Not, Repository } from 'typeorm';
import Razorpay = require('razorpay');
import * as crypto from 'crypto';
import {
  BillingInterval,
  RazorpayOrderPayload,
  RefundResult,
  SubscriptionActionResult,
  VerifyPaymentResult,
} from './types/billing.types';
import { CreateRazorpayOrderInput } from './dto/create-razorpay-order.input';
import { VerifyRazorpayPaymentInput } from './dto/verify-razorpay-payment.input';
import { CancelRazorpaySubscriptionInput } from './dto/cancel-razorpay-subscription.input';
import { ChangeRazorpaySubscriptionPlanInput } from './dto/change-razorpay-subscription-plan.input';
import { RefundRazorpayPaymentInput } from './dto/refund-razorpay-payment.input';
import { BillingPayment } from './entities/billing-payment.entity';
import { CompanySettings } from '../company/company-settings.entity';
import { Role } from '../auth/enums/role.enum';

type BillingAuthUser = {
  id: string;
  role?: string;
  activeCompanyId?: string;
};

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        subscription_id?: string;
        invoice_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        current_start?: number;
        current_end?: number;
        cancel_at_cycle_end?: boolean | number;
        notes?: Record<string, unknown>;
      };
    };
  };
};

const PRICING_INR: Record<'STANDARD' | 'PRO', { yearly: number }> = {
  STANDARD: { yearly: 999 },
  PRO: { yearly: 1499 },
};

function computeAmountInPaise(
  plan: 'STANDARD' | 'PRO',
  interval: BillingInterval,
): number {
  const price = PRICING_INR[plan];
  if (!price) throw new BadRequestException(`Unknown plan: ${plan}`);

  if (interval === BillingInterval.MONTHLY) {
    throw new BadRequestException('Monthly subscriptions are not supported');
  }

  const amountInInr = price.yearly;

  return Math.round(amountInInr * 100);
}

import { RazorpayWebhookEvent } from './entities/razorpay-webhook-event.entity';

@Injectable()
export class BillingService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(BillingPayment)
    private readonly billingPaymentRepository: Repository<BillingPayment>,
    @InjectRepository(CompanySettings)
    private readonly companySettingsRepository: Repository<CompanySettings>,
    @InjectRepository(RazorpayWebhookEvent)
    private readonly webhookEventRepository: Repository<RazorpayWebhookEvent>,
  ) {}

  private getRazorpayClient(): Razorpay {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new BadRequestException(
        'Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)',
      );
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  private getRazorpayKeySecret(): string {
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new BadRequestException(
        'Razorpay is not configured (missing RAZORPAY_KEY_SECRET)',
      );
    }
    return keySecret;
  }

  private getRazorpayWebhookSecret(): string {
    const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException(
        'Razorpay webhook is not configured (missing RAZORPAY_WEBHOOK_SECRET)',
      );
    }
    return secret;
  }

  private getPlanId(plan: 'STANDARD' | 'PRO'): string | undefined {
    if (plan === 'STANDARD') {
      return this.configService.get<string>('RAZORPAY_PLAN_ID_STANDARD');
    }
    return this.configService.get<string>('RAZORPAY_PLAN_ID_PRO');
  }

  private normalizeWebhookNotes(notes: unknown): Record<string, unknown> {
    return notes && typeof notes === 'object' ? (notes as Record<string, unknown>) : {};
  }

  private getStringFromNotes(notes: Record<string, unknown>, key: string): string | undefined {
    const value = notes[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private getIntervalFromNotes(notes: Record<string, unknown>): BillingInterval {
    const raw = this.getStringFromNotes(notes, 'interval');
    return raw === BillingInterval.YEARLY ? BillingInterval.YEARLY : BillingInterval.YEARLY;
  }

  private getPlanFromNotes(notes: Record<string, unknown>): 'STANDARD' | 'PRO' | undefined {
    const raw = this.getStringFromNotes(notes, 'plan');
    if (raw === 'STANDARD' || raw === 'PRO') return raw;
    return undefined;
  }

  private unixToDateOrUndefined(ts: unknown): Date | undefined {
    if (typeof ts !== 'number' || !Number.isFinite(ts) || ts <= 0) return undefined;
    return new Date(ts * 1000);
  }

  private async enrichPaymentWithInvoice(params: {
    razorpay: Razorpay;
    paymentId: string;
  }): Promise<{ invoiceId?: string; invoiceUrl?: string }> {
    try {
      const payment = await params.razorpay.payments.fetch(params.paymentId);
      const invoiceId = (payment as any)?.invoice_id as string | undefined;

      if (!invoiceId) return {};

      let invoiceUrl: string | undefined;
      try {
        const invoice = await (params.razorpay as any).invoices.fetch(invoiceId);
        invoiceUrl =
          (invoice as any)?.short_url ||
          (invoice as any)?.public_url ||
          (invoice as any)?.url ||
          (invoice as any)?.hosted_url;
      } catch {
        // If invoice fetch fails, still store invoiceId.
      }

      return { invoiceId, invoiceUrl };
    } catch {
      return {};
    }
  }

  private verifyRazorpayWebhookSignature(params: {
    rawBody: Buffer;
    signature?: string;
  }): void {
    const { rawBody, signature } = params;

    if (!signature) {
      throw new ForbiddenException('Missing Razorpay webhook signature');
    }

    const secret = this.getRazorpayWebhookSecret();
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    // Use timingSafeEqual when lengths match; otherwise fail fast.
    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      throw new ForbiddenException('Invalid Razorpay webhook signature');
    }
  }

  async handleRazorpayWebhook(params: {
    rawBody: Buffer;
    signature?: string;
    eventId?: string;
    body: unknown;
  }): Promise<void> {
    this.verifyRazorpayWebhookSignature({
      rawBody: params.rawBody,
      signature: params.signature,
    });

    const body = params.body as RazorpayWebhookBody;
    const event = body?.event;

    if (params.eventId && event) {
      try {
        await this.webhookEventRepository.insert({
          event_id: params.eventId,
          event_type: event,
        });
      } catch (error: any) {
        // If it's a unique constraint violation (code 23505 in Postgres), we already processed it
        if (error.code === '23505' || error.message?.includes('unique constraint')) {
          return; // Idempotent success
        }
        throw error;
      }
    }

    const paymentEntity = body?.payload?.payment?.entity;
    const orderEntity = body?.payload?.order?.entity;
    const subscriptionEntity = body?.payload?.subscription?.entity;

    const orderId = paymentEntity?.order_id ?? orderEntity?.id;
    const subscriptionId =
      paymentEntity?.subscription_id ?? subscriptionEntity?.id;
    if (!orderId && !subscriptionId) return;

    // Subscription renewal charge: create a new payment row keyed by payment_id.
    if (event === 'subscription.charged') {
      const paymentId = paymentEntity?.id;
      if (!paymentId || !subscriptionId) return;

      const existingByPayment = await this.billingPaymentRepository.findOne({
        where: { razorpay_payment_id: paymentId },
      });
      if (existingByPayment) return;

      // Resolve company/user/plan from notes (preferred) or from existing subscription record.
      const notes = this.normalizeWebhookNotes(subscriptionEntity?.notes);
      const companyIdFromNotes = this.getStringFromNotes(notes, 'companyId');
      const userIdFromNotes = this.getStringFromNotes(notes, 'userId');
      const planFromNotes = this.getPlanFromNotes(notes);
      const intervalFromNotes = this.getIntervalFromNotes(notes);

      const existingSubscriptionRecord = await this.billingPaymentRepository.findOne({
        where: { razorpay_subscription_id: subscriptionId },
        order: { created_at: 'DESC' },
      });

      const companyId =
        companyIdFromNotes ?? existingSubscriptionRecord?.company_id;
      const userId = userIdFromNotes ?? existingSubscriptionRecord?.user_id;
      const plan = planFromNotes ?? existingSubscriptionRecord?.plan;

      if (!companyId || !userId || !plan) {
        // Not enough context to safely apply a plan update.
        return;
      }

      const amount = paymentEntity?.amount ?? existingSubscriptionRecord?.amount;
      const currency = paymentEntity?.currency ?? existingSubscriptionRecord?.currency ?? 'INR';

      if (typeof amount !== 'number') return;

      const razorpay = this.getRazorpayClient();
      const invoice = await this.enrichPaymentWithInvoice({ razorpay, paymentId });

      const renewalPayment = this.billingPaymentRepository.create({
        company_id: companyId,
        user_id: userId,
        plan,
        interval: intervalFromNotes,
        amount,
        currency,
        status: 'PAID',
        razorpay_subscription_id: subscriptionId,
        razorpay_payment_id: paymentId,
        razorpay_invoice_id: invoice.invoiceId ?? paymentEntity?.invoice_id,
        razorpay_invoice_url: invoice.invoiceUrl,
        receipt: `subscription_${subscriptionId}_${Date.now()}`,
        paid_at: new Date(),
      });

      await this.billingPaymentRepository.save(renewalPayment);
      await this.companySettingsRepository.update(
        { company_id: companyId },
        { plan, cancel_at: null },
      );
      return;
    }

    // Subscription termination signals: ensure the plan is not left active.
    if (event === 'subscription.halted' || event === 'subscription.cancelled') {
      if (!subscriptionId) return;

      const notes = this.normalizeWebhookNotes(subscriptionEntity?.notes);
      const companyIdFromNotes = this.getStringFromNotes(notes, 'companyId');

      const existingSubscriptionRecord = await this.billingPaymentRepository.findOne({
        where: { razorpay_subscription_id: subscriptionId },
        order: { created_at: 'DESC' },
      });

      const companyId = companyIdFromNotes ?? existingSubscriptionRecord?.company_id;
      if (!companyId) return;

      const currentEnd = this.unixToDateOrUndefined(subscriptionEntity?.current_end);
      const now = new Date();

      // If Razorpay indicates the subscription has ended (or is halted), downgrade.
      const shouldDowngradeNow =
        event === 'subscription.halted' ||
        !currentEnd ||
        currentEnd.getTime() <= now.getTime();

      if (shouldDowngradeNow) {
        await this.companySettingsRepository.update(
          { company_id: companyId },
          { plan: 'FREE', cancel_at: null },
        );
      }

      return;
    }

    const webhookPaymentId = paymentEntity?.id;

    const paymentRecordByPaymentId = webhookPaymentId
      ? await this.billingPaymentRepository.findOne({
          where: { razorpay_payment_id: webhookPaymentId },
        })
      : null;

    const paymentRecord =
      paymentRecordByPaymentId ??
      (await this.billingPaymentRepository.findOne({
        where: subscriptionId
          ? { razorpay_subscription_id: subscriptionId }
          : { razorpay_order_id: orderId },
        order: subscriptionId ? { created_at: 'DESC' } : undefined,
      }));

    // If it's not our order, ignore (but still return 200).
    if (!paymentRecord) return;

    const webhookAmount = paymentEntity?.amount ?? orderEntity?.amount;
    if (typeof webhookAmount === 'number' && webhookAmount !== paymentRecord.amount) {
      // Don't auto-upgrade on suspicious mismatched amounts.
      paymentRecord.status = 'FAILED';
      paymentRecord.razorpay_payment_id = paymentEntity?.id ?? paymentRecord.razorpay_payment_id;
      await this.billingPaymentRepository.save(paymentRecord);
      return;
    }

    if (event === 'payment.failed') {
      paymentRecord.status = 'FAILED';
      paymentRecord.razorpay_payment_id = paymentEntity?.id ?? paymentRecord.razorpay_payment_id;
      await this.billingPaymentRepository.save(paymentRecord);
      return;
    }

    // Most reliable success signal for subscriptions-like flows via Checkout.
    if (event === 'payment.captured' || event === 'order.paid') {
      if (paymentRecord.status !== 'PAID') {
        paymentRecord.status = 'PAID';
        paymentRecord.razorpay_payment_id = paymentEntity?.id ?? paymentRecord.razorpay_payment_id;
        paymentRecord.paid_at = paymentRecord.paid_at ?? new Date();

        const paymentId = paymentRecord.razorpay_payment_id;
        if (paymentId) {
          const razorpay = this.getRazorpayClient();
          const invoice = await this.enrichPaymentWithInvoice({ razorpay, paymentId });
          paymentRecord.razorpay_invoice_id =
            invoice.invoiceId ?? paymentEntity?.invoice_id ?? paymentRecord.razorpay_invoice_id;
          paymentRecord.razorpay_invoice_url =
            invoice.invoiceUrl ?? paymentRecord.razorpay_invoice_url;
        }

        await this.billingPaymentRepository.save(paymentRecord);

        await this.companySettingsRepository.update(
          { company_id: paymentRecord.company_id },
          { plan: paymentRecord.plan, cancel_at: null },
        );
      }
    }
  }

  private assertCanManageBilling(
    user: BillingAuthUser | null | undefined,
  ): asserts user is BillingAuthUser & { activeCompanyId: string } {
    const role = (user?.role || '').toUpperCase();
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the company owner can manage billing');
    }

    if (!user?.activeCompanyId) {
      throw new BadRequestException('No active company selected');
    }
  }

  private assertCanRefund(
    user: BillingAuthUser | null | undefined,
  ): asserts user is BillingAuthUser & { activeCompanyId: string } {
    const role = (user?.role || '').toUpperCase();
    if (role !== Role.OWNER && role !== Role.ADMIN) {
      throw new ForbiddenException('Only an admin/owner can issue refunds');
    }

    if (!user?.activeCompanyId) {
      throw new BadRequestException('No active company selected');
    }
  }

  async createRazorpayOrder(
    user: BillingAuthUser | null,
    input: CreateRazorpayOrderInput,
  ): Promise<RazorpayOrderPayload> {
    this.assertCanManageBilling(user);

    if (input.idempotencyKey) {
      const existingPayment = await this.billingPaymentRepository.findOne({
        where: {
          company_id: user.activeCompanyId,
          idempotency_key: input.idempotencyKey,
        },
      });

      if (existingPayment) {
        // Return existing payload if the key matches a previous request
        return {
          orderId: existingPayment.razorpay_order_id ?? existingPayment.razorpay_subscription_id ?? '',
          subscriptionId: existingPayment.razorpay_subscription_id,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          receipt: existingPayment.receipt ?? '',
          plan: existingPayment.plan,
          interval: existingPayment.interval,
        };
      }
    }

    const plan = input.plan;
    const interval = input.interval;

    const amount = computeAmountInPaise(plan, interval);
    const currency = 'INR';

    const receipt = `company_${user.activeCompanyId}_${plan}_${interval}_${Date.now()}`;

    const razorpay = this.getRazorpayClient();

    const planId = this.getPlanId(plan);
    if (planId) {
      // Preferred flow: create a subscription against a Razorpay Plan.
      // NOTE: Razorpay requires total_count and enforces an upper limit (commonly 100).
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 100,
        quantity: 1,
        customer_notify: 1,
        notes: {
          companyId: user.activeCompanyId,
          userId: user.id,
          plan,
          interval,
          receipt,
        },
      });

      const payment = this.billingPaymentRepository.create({
        company_id: user.activeCompanyId,
        user_id: user.id,
        plan,
        interval,
        amount,
        currency,
        status: 'CREATED',
        razorpay_subscription_id: subscription.id,
        receipt,
        idempotency_key: input.idempotencyKey,
      });

      await this.billingPaymentRepository.save(payment);

      // Keep orderId populated for backward compatibility; frontend should prefer subscriptionId.
      return {
        orderId: subscription.id,
        subscriptionId: subscription.id,
        amount,
        currency,
        receipt,
        plan,
        interval,
      };
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: true,
      notes: {
        companyId: user.activeCompanyId,
        userId: user.id,
        plan,
        interval,
      },
    });

    // Persist the order so we can validate plan/amount later.
    const payment = this.billingPaymentRepository.create({
      company_id: user.activeCompanyId,
      user_id: user.id,
      plan,
      interval,
      amount,
      currency,
      status: 'CREATED',
      razorpay_order_id: order.id,
      receipt,
      idempotency_key: input.idempotencyKey,
    });

    await this.billingPaymentRepository.save(payment);

    return {
      orderId: order.id,
      amount,
      currency,
      receipt,
      plan,
      interval,
    };
  }

  async verifyRazorpayPayment(
    user: BillingAuthUser | null,
    input: VerifyRazorpayPaymentInput,
  ): Promise<VerifyPaymentResult> {
    this.assertCanManageBilling(user);

    const { razorpayOrderId, razorpaySubscriptionId, razorpayPaymentId, razorpaySignature } =
      input;

    if (!razorpaySubscriptionId && !razorpayOrderId) {
      throw new BadRequestException('Missing razorpayOrderId or razorpaySubscriptionId');
    }

    // Lookup: prefer subscription id when present. Also tolerate a subscription id accidentally
    // coming in as razorpayOrderId (it will start with "sub_").
    let payment = await this.billingPaymentRepository.findOne({
      where: razorpaySubscriptionId
        ? { razorpay_subscription_id: razorpaySubscriptionId }
        : { razorpay_order_id: razorpayOrderId },
    });

    if (!payment && !razorpaySubscriptionId && razorpayOrderId?.startsWith('sub_')) {
      payment = await this.billingPaymentRepository.findOne({
        where: { razorpay_subscription_id: razorpayOrderId },
      });
    }

    if (!payment) {
      throw new BadRequestException('Unknown order/subscription');
    }

    if (payment.company_id !== user.activeCompanyId) {
      throw new ForbiddenException('Order does not belong to active company');
    }

    if (payment.status === 'PAID') {
      // Idempotent response
      return { success: true, newPlan: payment.plan };
    }

    // Signature verification for Checkout:
    // Order: expected = hmac_sha256(key_secret, order_id + '|' + payment_id)
    // Subscription: expected = hmac_sha256(key_secret, subscription_id + '|' + payment_id)
    const keySecret = this.getRazorpayKeySecret();
    const idForSignature = razorpaySubscriptionId || razorpayOrderId || '';
    const expectedA = crypto
      .createHmac('sha256', keySecret)
      .update(`${idForSignature}|${razorpayPaymentId}`)
      .digest('hex');
    const expectedB = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayPaymentId}|${idForSignature}`)
      .digest('hex');

    if (expectedA !== razorpaySignature && expectedB !== razorpaySignature) {
      // Mark order as failed for tracking.
      payment.status = 'FAILED';
      payment.razorpay_payment_id = razorpayPaymentId;
      await this.billingPaymentRepository.save(payment);

      throw new BadRequestException('Invalid payment signature');
    }

    // Mark paid
    payment.status = 'PAID';
    payment.razorpay_payment_id = razorpayPaymentId;
    payment.paid_at = new Date();

    const razorpay = this.getRazorpayClient();
    const invoice = await this.enrichPaymentWithInvoice({
      razorpay,
      paymentId: razorpayPaymentId,
    });
    payment.razorpay_invoice_id = invoice.invoiceId ?? payment.razorpay_invoice_id;
    payment.razorpay_invoice_url = invoice.invoiceUrl ?? payment.razorpay_invoice_url;

    await this.billingPaymentRepository.save(payment);

    // Upgrade company plan
    await this.companySettingsRepository.update(
      { company_id: user.activeCompanyId },
      { plan: payment.plan },
    );

    return { success: true, newPlan: payment.plan };
  }

  private async resolveSubscriptionIdForCompany(params: {
    companyId: string;
    explicitSubscriptionId?: string;
  }): Promise<string> {
    if (params.explicitSubscriptionId) return params.explicitSubscriptionId;

    const latest = await this.billingPaymentRepository.findOne({
      where: {
        company_id: params.companyId,
        status: 'PAID',
        razorpay_subscription_id: Not(IsNull()),
      },
      order: { paid_at: 'DESC', created_at: 'DESC' },
    });

    const subId = latest?.razorpay_subscription_id;
    if (!subId) {
      throw new BadRequestException('No active subscription found for this company');
    }

    return subId;
  }

  async cancelRazorpaySubscription(
    user: BillingAuthUser | null,
    input: CancelRazorpaySubscriptionInput,
  ): Promise<SubscriptionActionResult> {
    this.assertCanManageBilling(user);

    const subscriptionId = await this.resolveSubscriptionIdForCompany({
      companyId: user.activeCompanyId,
      explicitSubscriptionId: input.razorpaySubscriptionId,
    });

    const razorpay = this.getRazorpayClient();

    // Cancel renewal only: keep subscription active until current_end.
    let cancelAtCycleEnd = true;
    let result;

    try {
      result = await (razorpay as any).subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: 1,
      });
    } catch (error: any) {
      if (
        error?.statusCode === 400 &&
        error?.error?.description?.includes('no billing cycle is going on')
      ) {
        // The subscription hasn't fully started its first billing cycle yet.
        // We must cancel it immediately instead of at cycle end.
        cancelAtCycleEnd = false;
        result = await (razorpay as any).subscriptions.cancel(subscriptionId, {
          cancel_at_cycle_end: 0,
        });
      } else {
        throw error;
      }
    }

    const currentEnd = this.unixToDateOrUndefined((result as any)?.current_end);
    
    // Save the cancel date so the UI knows it will not renew
    await this.companySettingsRepository.update(
      { company_id: user.activeCompanyId },
      { cancel_at: currentEnd || new Date() },
    );

    return {
      success: true,
      subscriptionId,
      status: (result as any)?.status,
      cancelAtCycleEnd,
      currentEnd: this.unixToDateOrUndefined((result as any)?.current_end),
    };
  }

  async changeRazorpaySubscriptionPlan(
    user: BillingAuthUser | null,
    input: ChangeRazorpaySubscriptionPlanInput,
  ): Promise<SubscriptionActionResult> {
    this.assertCanManageBilling(user);

    const subscriptionId = await this.resolveSubscriptionIdForCompany({
      companyId: user.activeCompanyId,
      explicitSubscriptionId: input.razorpaySubscriptionId,
    });

    const newPlan = input.newPlan;
    const planId = this.getPlanId(newPlan);
    if (!planId) {
      throw new BadRequestException(
        `Razorpay plan_id is not configured for ${newPlan} (missing env var)`,
      );
    }

    const razorpay = this.getRazorpayClient();

    // Best-effort: update subscription plan in-place. If your account has proration
    // enabled, Razorpay will handle any immediate charge/refund.
    const updated = await (razorpay as any).subscriptions.update(subscriptionId, {
      plan_id: planId,
      schedule_change_at: 'now',
    });

    await this.companySettingsRepository.update(
      { company_id: user.activeCompanyId },
      { plan: newPlan, cancel_at: null },
    );

    return {
      success: true,
      subscriptionId,
      status: (updated as any)?.status,
      newPlan,
      currentEnd: this.unixToDateOrUndefined((updated as any)?.current_end),
    };
  }

  async refundRazorpayPayment(
    user: BillingAuthUser | null,
    input: RefundRazorpayPaymentInput,
  ): Promise<RefundResult> {
    this.assertCanRefund(user);

    const paymentRecord = await this.billingPaymentRepository.findOne({
      where: {
        company_id: user.activeCompanyId,
        razorpay_payment_id: input.razorpayPaymentId,
      },
    });

    if (!paymentRecord) {
      throw new BadRequestException('Unknown payment for active company');
    }

    const razorpay = this.getRazorpayClient();

    const refund = await (razorpay as any).payments.refund(input.razorpayPaymentId, {
      ...(typeof input.amount === 'number' ? { amount: input.amount } : {}),
    });

    return {
      success: true,
      refundId: (refund as any)?.id,
      status: (refund as any)?.status,
    };
  }

  async getBillingHistory(user: BillingAuthUser | null): Promise<BillingPayment[]> {
    this.assertCanManageBilling(user);

    return this.billingPaymentRepository.find({
      where: { company_id: user.activeCompanyId, status: 'PAID' },
      order: { created_at: 'DESC' },
      take: 25,
    });
  }
}
