import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  SEND_INVITE,
  ACCEPT_INVITE,
  CANCEL_INVITE,
  VALIDATE_INVITE,
  COMPANY_INVITES,
  MY_PENDING_INVITES,
} from '@/lib/graphql/invite';
import {
  GET_COMPANY_AUDIT_LOGS,
  GET_COMPANY_MEMBERS,
  REMOVE_MEMBER,
  UPDATE_MEMBER_WAREHOUSES,
} from '@/lib/graphql/audit';
import { GET_AUDIT_LOGS_CONNECTION } from '@/lib/graphql/connections';
import { useCursorPagination } from './useCursorPagination';
import type { CursorPaginationInput } from '@/types/pagination';

// ── Invites ──

export function useCompanyInvites(companyId: string) {
  return useQuery(COMPANY_INVITES, {
    variables: { companyId },
    skip: !companyId,
  });
}

export function useMyPendingInvites() {
  return useQuery(MY_PENDING_INVITES);
}

export function useValidateInvite(token: string) {
  return useQuery(VALIDATE_INVITE, {
    variables: { token },
    skip: !token,
    fetchPolicy: 'network-only',
  });
}

export function useLazyValidateInvite() {
  return useLazyQuery(VALIDATE_INVITE, {
    fetchPolicy: 'network-only',
  });
}

export function useSendInvite() {
  return useMutation(SEND_INVITE, {
    update(cache, { data }) {
      if (!data?.sendInvite) return;
      cache.modify({
        fields: {
          companyInvites(existing = []) {
            const ref = cache.identify(data.sendInvite);
            if (!ref) return existing;
            return [...existing, { __ref: ref }];
          },
        },
      });
    },
  });
}

export function useAcceptInvite() {
  return useMutation(ACCEPT_INVITE);
}

export function useCancelInvite() {
  return useMutation(CANCEL_INVITE, {
    update(cache, { data }) {
      if (!data?.cancelInvite) return;
      // Boolean return – evict the invites list to refetch on next access
      cache.modify({
        fields: {
          companyInvites(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

// ── Company Members ──

export function useCompanyMembers(companyId: string) {
  return useQuery(GET_COMPANY_MEMBERS, {
    variables: { companyId },
    skip: !companyId,
  });
}

export function useLazyCompanyMembers() {
  return useLazyQuery(GET_COMPANY_MEMBERS);
}

export function useRemoveMember() {
  return useMutation(REMOVE_MEMBER, {
    update(cache, { data }) {
      if (!data?.removeMemberValidated) return;
      cache.modify({
        fields: {
          companyMembers(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useUpdateMemberWarehouses() {
  return useMutation(UPDATE_MEMBER_WAREHOUSES, {
    update(cache, { data }) {
      if (!data?.updateMemberWarehouses) return;
      cache.modify({
        fields: {
          companyMembers(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

// ── Audit ──

export function useCompanyAuditLogs(variables?: {
  filters?: Record<string, unknown>;
  pagination?: { page: number; limit: number };
}) {
  return useQuery(GET_COMPANY_AUDIT_LOGS, {
    variables,
    fetchPolicy: 'network-only',
  });
}

export function useLazyCompanyAuditLogs() {
  return useLazyQuery(GET_COMPANY_AUDIT_LOGS, {
    fetchPolicy: 'network-only',
  });
}

export function useAuditLogsConnection(
  input?: CursorPaginationInput,
  filters?: Record<string, unknown>,
) {
  return useCursorPagination(
    GET_AUDIT_LOGS_CONNECTION,
    'auditLogsConnection',
    { variables: { input: input ?? { first: 20 }, filters }, fetchPolicy: 'cache-and-network' },
  );
}
