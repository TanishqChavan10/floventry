'use client';

import CompanyGuard from '@/components/CompanyGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { addDays, endOfDay, format, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Loader2 } from 'lucide-react';
import { GET_COMPANY_BY_SLUG } from '@/lib/graphql/company';
import { GET_COMPANY_AUDIT_LOGS, GET_COMPANY_MEMBERS } from '@/lib/graphql/audit';

type AuditAction =
  | 'GRN_POSTED'
  | 'ISSUE_POSTED'
  | 'TRANSFER_POSTED'
  | 'ADJUSTMENT_CREATED'
  | 'OPENING_STOCK_SET'
  | 'WAREHOUSE_CREATED'
  | 'WAREHOUSE_ARCHIVED'
  | 'WAREHOUSE_REACTIVATED'
  | 'USER_INVITED'
  | 'USER_REMOVED'
  | 'ROLE_CHANGED'
  | 'USER_ASSIGNED_TO_WAREHOUSE'
  | 'USER_REMOVED_FROM_WAREHOUSE'
  | 'BULK_IMPORT_STARTED'
  | 'BULK_IMPORT_COMPLETED'
  | 'BARCODE_LABELS_GENERATED'
  | 'EXPIRY_SCAN_RUN'
  | 'LOT_EXPIRED'
  | 'LOT_EXPIRING_SOON'
  | string;

type AuditEntityType =
  | 'WAREHOUSE'
  | 'GRN'
  | 'ISSUE'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'OPENING_STOCK'
  | 'USER'
  | 'PRODUCT'
  | 'STOCK_LOT'
  | 'BULK_IMPORT'
  | 'BARCODE'
  | string;

type AuditLogItem = {
  id: string;
  created_at: string;
  actor_user_id: string;
  actor_email: string;
  actor_role: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

type AuditLogResponse = {
  companyAuditLogs: {
    items: AuditLogItem[];
    pageInfo: {
      total: number;
      page: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

type CompanyBySlugResponse = {
  companyBySlug: {
    id: string;
    slug: string;
  };
};

type CompanyMembersResponse = {
  companyMembers: Array<{
    user_id: string;
    role: string;
    user: {
      email: string;
      fullName?: string | null;
    };
  }>;
};

const ACTION_LABELS: Record<string, string> = {
  GRN_POSTED: 'GRN posted',
  ISSUE_POSTED: 'Stock issued',
  TRANSFER_POSTED: 'Warehouse transfer completed',
  ADJUSTMENT_CREATED: 'Inventory adjustment made',
  OPENING_STOCK_SET: 'Opening stock set',
  WAREHOUSE_CREATED: 'Warehouse created',
  WAREHOUSE_ARCHIVED: 'Warehouse archived',
  WAREHOUSE_REACTIVATED: 'Warehouse reactivated',
  USER_INVITED: 'User invited',
  USER_REMOVED: 'User removed',
  ROLE_CHANGED: 'User role updated',
  USER_ASSIGNED_TO_WAREHOUSE: 'User assigned to warehouse',
  USER_REMOVED_FROM_WAREHOUSE: 'User removed from warehouse',
  BULK_IMPORT_STARTED: 'Bulk import started',
  BULK_IMPORT_COMPLETED: 'Bulk import completed',
  BARCODE_LABELS_GENERATED: 'Barcode labels generated',
  EXPIRY_SCAN_RUN: 'Expiry scan run',
  LOT_EXPIRED: 'Stock lot expired',
  LOT_EXPIRING_SOON: 'Stock lot expiring soon',
};

const ENTITY_LABELS: Record<string, string> = {
  WAREHOUSE: 'Warehouse',
  GRN: 'GRN',
  ISSUE: 'Issue',
  TRANSFER: 'Transfer',
  ADJUSTMENT: 'Adjustment',
  OPENING_STOCK: 'Opening stock',
  USER: 'User',
  PRODUCT: 'Product',
  STOCK_LOT: 'Stock lot',
  BULK_IMPORT: 'Bulk import',
  BARCODE: 'Barcode',
};

function titleizeEnum(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function safeString(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function truncateString(value: string, max = 220) {
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + '…';
}

function sanitizeMetadata(input: unknown, depth = 0): unknown {
  if (depth > 3) return '[truncated]';
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return truncateString(input, 260);
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (Array.isArray(input)) {
    const maxItems = 25;
    const sliced = input.slice(0, maxItems).map((v) => sanitizeMetadata(v, depth + 1));
    if (input.length > maxItems) {
      return [...sliced, `…(${input.length - maxItems} more)`];
    }
    return sliced;
  }
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const keys = Object.keys(record).slice(0, 40);
    for (const key of keys) {
      out[key] = sanitizeMetadata(record[key], depth + 1);
    }
    if (Object.keys(record).length > keys.length) {
      out.__truncated__ = true;
    }
    return out;
  }
  return String(input);
}

function getActionLabel(action: string) {
  return ACTION_LABELS[action] ?? titleizeEnum(action);
}

function getEntityTypeLabel(entityType: string) {
  return ENTITY_LABELS[entityType] ?? titleizeEnum(entityType);
}

function buildSummary(
  action: string,
  entityType: string,
  metadata?: Record<string, unknown> | null,
) {
  const m = (metadata ?? {}) as Record<string, unknown>;

  const reason = safeString(m.reason) ?? safeString(m.note) ?? safeString(m.description);
  if (action === 'GRN_POSTED') {
    const itemCount = typeof m.itemCount === 'number' ? m.itemCount : undefined;
    const warehouseName = safeString(m.warehouseName);
    const parts = [
      itemCount !== undefined ? `GRN posted with ${itemCount} items` : 'GRN posted',
      warehouseName ? `to ${warehouseName}` : undefined,
    ].filter(Boolean);
    return parts.join(' ');
  }

  if (action === 'WAREHOUSE_ARCHIVED') {
    return reason ? `Warehouse archived: ${truncateString(reason, 140)}` : 'Warehouse archived';
  }

  if (action === 'WAREHOUSE_REACTIVATED') {
    return reason
      ? `Warehouse reactivated: ${truncateString(reason, 140)}`
      : 'Warehouse reactivated';
  }

  if (action === 'BULK_IMPORT_COMPLETED') {
    const status = safeString(m.status) ?? safeString(m.result);
    return status
      ? `Bulk import completed (${truncateString(status, 80)})`
      : 'Bulk import completed';
  }

  if (action === 'LOT_EXPIRED' || action === 'LOT_EXPIRING_SOON') {
    const count =
      typeof m.count === 'number'
        ? m.count
        : typeof m.lotCount === 'number'
          ? m.lotCount
          : undefined;
    const suffix = count !== undefined ? ` (${count})` : '';
    return `${getActionLabel(action)}${suffix}`;
  }

  if (reason) return truncateString(reason, 160);

  // Safe fallback: human action + entity type.
  return `${getActionLabel(action)} (${getEntityTypeLabel(entityType)})`;
}

function getEntityDisplay(log: AuditLogItem) {
  const m = (log.metadata ?? {}) as Record<string, unknown>;

  switch (log.entity_type) {
    case 'WAREHOUSE': {
      const warehouseName = safeString(m.warehouseName);
      const archived = Boolean(m.archived) || safeString(m.status) === 'ARCHIVED';
      if (!warehouseName) return archived ? 'Warehouse (Archived)' : 'Warehouse';
      return archived ? `Warehouse: ${warehouseName} (Archived)` : `Warehouse: ${warehouseName}`;
    }
    case 'GRN': {
      const grnNumber = safeString(m.grnNumber);
      return grnNumber ? `GRN: ${grnNumber}` : 'GRN';
    }
    case 'USER': {
      const userEmail = safeString(m.userEmail) ?? safeString(m.email);
      return userEmail ? `User: ${userEmail}` : 'User';
    }
    default: {
      const label = getEntityTypeLabel(log.entity_type);
      const name = safeString(m.name) ?? safeString(m.title) ?? safeString(m.label);
      if (name) return `${label}: ${name}`;
      return label;
    }
  }
}

function getEntityHref(companySlug: string, log: AuditLogItem): string | undefined {
  const m = (log.metadata ?? {}) as Record<string, unknown>;

  if (log.entity_type === 'WAREHOUSE') {
    const warehouseSlug = safeString(m.warehouseSlug);
    if (!warehouseSlug) return undefined;
    return `/${companySlug}/warehouses/${warehouseSlug}/inventory`;
  }

  if (log.entity_type === 'GRN') {
    const warehouseSlug = safeString(m.warehouseSlug);
    if (!warehouseSlug || !log.entity_id) return undefined;
    return `/${companySlug}/warehouses/${warehouseSlug}/inventory/grn/${log.entity_id}`;
  }

  return undefined;
}

const roleBadgeClasses: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

function AuditLogContent() {
  const params = useParams();
  const companySlug = params?.slug as string;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: addDays(new Date(), -30),
    to: new Date(),
  }));

  const [action, setAction] = useState<string>('all');
  const [entityType, setEntityType] = useState<string>('all');
  const [actorUserId, setActorUserId] = useState<string>('all');
  const [limit, setLimit] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const { data: companyData } = useQuery<CompanyBySlugResponse>(GET_COMPANY_BY_SLUG, {
    variables: { slug: companySlug },
    skip: !companySlug,
  });
  const companyId = companyData?.companyBySlug?.id;

  const { data: membersData } = useQuery<CompanyMembersResponse>(GET_COMPANY_MEMBERS, {
    variables: { companyId },
    skip: !companyId,
  });

  const filters = useMemo(() => {
    const from = dateRange?.from ? startOfDay(dateRange.from) : undefined;
    const to = dateRange?.to ? endOfDay(dateRange.to) : undefined;

    return {
      action: action !== 'all' ? action : undefined,
      entityType: entityType !== 'all' ? entityType : undefined,
      actorUserId: actorUserId !== 'all' ? actorUserId : undefined,
      dateFrom: from,
      dateTo: to,
    };
  }, [action, actorUserId, dateRange?.from, dateRange?.to, entityType]);

  useEffect(() => {
    setPage(1);
  }, [action, entityType, actorUserId, dateRange?.from, dateRange?.to, limit]);

  const {
    data: auditData,
    loading,
    error,
    refetch,
  } = useQuery<AuditLogResponse>(GET_COMPANY_AUDIT_LOGS, {
    variables: {
      filters,
      pagination: { page, limit },
    },
    skip: !companySlug,
    fetchPolicy: 'cache-and-network',
  });

  const audit = auditData?.companyAuditLogs;
  const items = audit?.items ?? [];
  const pageInfo = audit?.pageInfo;

  const actorOptions = useMemo(() => {
    const members = membersData?.companyMembers ?? [];
    return [...members]
      .filter((m) => m?.user_id && m?.user?.email)
      .sort((a, b) => a.user.email.localeCompare(b.user.email));
  }, [membersData?.companyMembers]);

  const totalPages = pageInfo ? Math.max(1, Math.ceil(pageInfo.total / pageInfo.limit)) : 1;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Audit Log
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              A complete history of critical actions across your company.
            </p>
          </div>
          <Button className="gap-2" variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/70 dark:bg-slate-950/80 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.keys(ACTION_LABELS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ACTION_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {Object.keys(ENTITY_LABELS).map((key) => (
                  <SelectItem key={key} value={key}>
                    {ENTITY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actorUserId} onValueChange={setActorUserId}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Actor (user)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {actorOptions.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.user.email} ({m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-slate-600 dark:text-slate-400">
              {pageInfo ? (
                <span>
                  {pageInfo.total.toLocaleString()} results • Page {pageInfo.page} / {totalPages}
                </span>
              ) : (
                <span>—</span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {String(error.message).toLowerCase().includes('access') ||
            String(error.message).toLowerCase().includes('forbidden')
              ? 'You don’t have access to audit logs.'
              : `Failed to load audit logs: ${error.message}`}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-600 dark:text-slate-400">
            No audit events found for the selected filters.
            <div className="mt-2 text-sm">Try adjusting your filters.</div>
          </div>
        ) : (
          <>
            {/* Audit Log Table */}
            <Card>
              <CardHeader>
                <CardTitle>Company Audit Log</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Context / Summary</TableHead>
                      <TableHead className="w-[120px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((log) => {
                      const dt = new Date(log.created_at);
                      const entityText = getEntityDisplay(log);
                      const href = getEntityHref(companySlug, log);
                      const summary = buildSummary(log.action, log.entity_type, log.metadata);
                      const isExpanded = expanded.has(log.id);

                      const actorEmail = safeString(log.actor_email) ?? 'Deleted User';
                      const actorRole = safeString(log.actor_role) ?? 'UNKNOWN';

                      const badgeClass =
                        roleBadgeClasses[actorRole] ??
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                      const sanitized = sanitizeMetadata(log.metadata ?? null);
                      const hasMetadata =
                        sanitized !== null &&
                        sanitized !== undefined &&
                        (typeof sanitized !== 'object' ||
                          (typeof sanitized === 'object' &&
                            Object.keys(sanitized as Record<string, unknown>).length > 0));

                      const metadataText = hasMetadata ? JSON.stringify(sanitized, null, 2) : '';

                      return (
                        <React.Fragment key={log.id}>
                          <TableRow>
                            <TableCell className="font-mono text-xs">
                              {format(dt, 'dd MMM yyyy, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{actorEmail}</span>
                                <div className="mt-1">
                                  <Badge className={badgeClass}>{actorRole}</Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getActionLabel(String(log.action))}
                            </TableCell>
                            <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                              <div className="flex flex-col">
                                {href ? (
                                  <Link
                                    href={href}
                                    className="text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    {entityText}
                                  </Link>
                                ) : (
                                  <span>{entityText}</span>
                                )}
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {getEntityTypeLabel(String(log.entity_type))}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                              {summary}
                            </TableCell>
                            <TableCell>
                              {hasMetadata ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleExpanded(log.id)}
                                >
                                  {isExpanded ? 'Hide' : 'View'}
                                </Button>
                              ) : (
                                <span className="text-sm text-slate-500">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                          {hasMetadata && isExpanded ? (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-slate-50 dark:bg-slate-900/40">
                                <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                  {metadataText}
                                </pre>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>

                {pageInfo ? (
                  <div className="pt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageInfo.hasPreviousPage) setPage((p) => Math.max(1, p - 1));
                            }}
                            aria-disabled={!pageInfo.hasPreviousPage}
                            className={
                              !pageInfo.hasPreviousPage
                                ? 'pointer-events-none opacity-50'
                                : undefined
                            }
                          />
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            isActive
                            size="default"
                            onClick={(e) => e.preventDefault()}
                          >
                            Page {pageInfo.page} / {totalPages}
                          </PaginationLink>
                        </PaginationItem>

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (pageInfo.hasNextPage) setPage((p) => p + 1);
                            }}
                            aria-disabled={!pageInfo.hasNextPage}
                            className={
                              !pageInfo.hasNextPage ? 'pointer-events-none opacity-50' : undefined
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <CompanyGuard>
      <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
        <AuditLogContent />
      </RoleGuard>
    </CompanyGuard>
  );
}
