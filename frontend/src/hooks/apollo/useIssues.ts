import { useQuery, useMutation, type MutationHookOptions } from '@apollo/client';
import {
  GET_ISSUE_NOTES_BY_WAREHOUSE,
  GET_ISSUE_NOTE,
  CREATE_ISSUE_NOTE,
  CREATE_ISSUE_NOTE_WITH_FEFO,
  UPDATE_ISSUE_NOTE,
  POST_ISSUE_NOTE,
  CANCEL_ISSUE_NOTE,
} from '@/lib/graphql/issues';

export function useIssueNotesByWarehouse(warehouseId: string) {
  return useQuery(GET_ISSUE_NOTES_BY_WAREHOUSE, {
    variables: { warehouseId },
    skip: !warehouseId,
    fetchPolicy: 'cache-and-network',
  });
}

export function useIssueNote(id: string) {
  return useQuery(GET_ISSUE_NOTE, {
    variables: { id },
    skip: !id,
  });
}

export function useCreateIssueNote() {
  return useMutation(CREATE_ISSUE_NOTE, {
    update(cache, { data }) {
      if (!data?.createIssueNote) return;
      cache.modify({
        fields: {
          issueNotesByWarehouse(existing = []) {
            const ref = cache.identify(data.createIssueNote);
            if (!ref) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useCreateIssueNoteWithFEFO(options?: MutationHookOptions) {
  return useMutation(CREATE_ISSUE_NOTE_WITH_FEFO, {
    ...options,
    update(cache, result, context) {
      options?.update?.(cache, result, context);
      if (!result.data?.createIssueNoteWithFEFO) return;
      cache.modify({
        fields: {
          issueNotesByWarehouse(existing = []) {
            const ref = cache.identify(result.data!.createIssueNoteWithFEFO);
            if (!ref) return existing;
            return [{ __ref: ref }, ...existing];
          },
        },
      });
    },
  });
}

export function useUpdateIssueNote() {
  return useMutation(UPDATE_ISSUE_NOTE);
}

export function usePostIssueNote(options?: MutationHookOptions) {
  return useMutation(POST_ISSUE_NOTE, {
    ...options,
    update(cache, result, context) {
      options?.update?.(cache, result, context);
      // Posting an issue note affects stock levels
      cache.modify({
        fields: {
          lowStockItems(_, { DELETE }) { return DELETE; },
          inventoryHealthStats(_, { DELETE }) { return DELETE; },
        },
      });
    },
  });
}

export function useCancelIssueNote(options?: MutationHookOptions) {
  return useMutation(CANCEL_ISSUE_NOTE, options);
}
