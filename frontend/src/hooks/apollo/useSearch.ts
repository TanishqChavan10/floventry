import { useLazyQuery } from '@apollo/client';
import {
  GLOBAL_SEARCH,
  GET_GRN_FOR_REDIRECT,
  GET_ISSUE_FOR_REDIRECT,
  GET_TRANSFER_FOR_REDIRECT,
} from '@/lib/graphql/search';

export function useGlobalSearchQuery() {
  return useLazyQuery(GLOBAL_SEARCH, { fetchPolicy: 'network-only' });
}

export function useGrnForRedirect() {
  return useLazyQuery(GET_GRN_FOR_REDIRECT);
}

export function useIssueForRedirect() {
  return useLazyQuery(GET_ISSUE_FOR_REDIRECT);
}

export function useTransferForRedirect() {
  return useLazyQuery(GET_TRANSFER_FOR_REDIRECT);
}
