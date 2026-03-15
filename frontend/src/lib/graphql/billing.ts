import { gql } from '@apollo/client';

export const CREATE_RAZORPAY_ORDER = gql`
  mutation CreateRazorpayOrder($input: CreateRazorpayOrderInput!) {
    createRazorpayOrder(input: $input) {
      orderId
      subscriptionId
      amount
      currency
      receipt
      plan
      interval
    }
  }
`;

export const VERIFY_RAZORPAY_PAYMENT = gql`
  mutation VerifyRazorpayPayment($input: VerifyRazorpayPaymentInput!) {
    verifyRazorpayPayment(input: $input) {
      success
      newPlan
    }
  }
`;

export const GET_BILLING_HISTORY = gql`
  query GetBillingHistory {
    billingHistory {
      id
      plan
      interval
      amount
      currency
      status
      razorpayOrderId
      razorpaySubscriptionId
      razorpayPaymentId
      razorpayInvoiceId
      razorpayInvoiceUrl
      createdAt
      paidAt
    }
  }
`;

export const CANCEL_RAZORPAY_SUBSCRIPTION = gql`
  mutation CancelRazorpaySubscription($input: CancelRazorpaySubscriptionInput!) {
    cancelRazorpaySubscription(input: $input) {
      success
      subscriptionId
      status
      cancelAtCycleEnd
      currentEnd
    }
  }
`;

export const CHANGE_RAZORPAY_SUBSCRIPTION_PLAN = gql`
  mutation ChangeRazorpaySubscriptionPlan($input: ChangeRazorpaySubscriptionPlanInput!) {
    changeRazorpaySubscriptionPlan(input: $input) {
      success
      subscriptionId
      status
      newPlan
      currentEnd
    }
  }
`;
