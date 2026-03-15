import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_RAZORPAY_ORDER,
  VERIFY_RAZORPAY_PAYMENT,
  GET_BILLING_HISTORY,
  CANCEL_RAZORPAY_SUBSCRIPTION,
  CHANGE_RAZORPAY_SUBSCRIPTION_PLAN,
} from '@/lib/graphql/billing';

export function useCreateRazorpayOrder() {
  return useMutation(CREATE_RAZORPAY_ORDER);
}

export function useVerifyRazorpayPayment() {
  return useMutation(VERIFY_RAZORPAY_PAYMENT);
}

export function useBillingHistory(options?: { skip?: boolean }) {
  return useQuery(GET_BILLING_HISTORY, {
    fetchPolicy: 'cache-and-network',
    skip: options?.skip,
  });
}

export function useCancelRazorpaySubscription() {
  return useMutation(CANCEL_RAZORPAY_SUBSCRIPTION);
}

export function useChangeRazorpaySubscriptionPlan() {
  return useMutation(CHANGE_RAZORPAY_SUBSCRIPTION_PLAN);
}
