'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCompanyAuditLogs, useCompanyMembers, useCompanyBySlug } from '@/hooks/apollo';
import { DateRange } from 'react-day-picker';

import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import RoleGuard from '@/components/guards/RoleGuard';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

import {
  ArrowLeft,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  User,
  Activity,
  Filter,
  X,
  Globe,
  Monitor,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  GRN_POSTED: 'Goods Receipt Posted',
  ISSUE_POSTED: 'Issue Note Posted',
  TRANSFER_POSTED: 'Transfer Posted',
  ADJUSTMENT_CREATED: 'Stock Adjustment Created',
  OPENING_STOCK_SET: 'Opening Stock Set',
  WAREHOUSE_CREATED: 'Warehouse Created',
  WAREHOUSE_ARCHIVED: 'Warehouse Archived',
  WAREHOUSE_REACTIVATED: 'Warehouse Reactivated',
  USER_INVITED: 'User Invited',
  USER_REMOVED: 'User Removed',
  ROLE_CHANGED: 'Role Changed',
  USER_ASSIGNED_TO_WAREHOUSE: 'User Assigned to Warehouse',
  USER_REMOVED_FROM_WAREHOUSE: 'User Removed from Warehouse',
  BULK_IMPORT_STARTED: 'Bulk Import Started',
  BULK_IMPORT_COMPLETED: 'Bulk Import Completed',
  BARCODE_LABELS_GENERATED: 'Barcode Labels Generated',
  EXPIRY_SCAN_RUN: 'Expiry Scan Run',
  LOT_EXPIRED: 'Lot Expired',
  LOT_EXPIRING_SOON: 'Lot Expiring Soon',
};

const ENTITY_LABELS: Record<string, string> = {
  WAREHOUSE: 'Warehouses',
  GRN: 'Goods Receipt',
  ISSUE: 'Issues',
  TRANSFER: 'Transfers',
  ADJUSTMENT: 'Inventory Adjustments',
  OPENING_STOCK: 'Opening Stock',
  USER: 'Users',
  PRODUCT: 'Products',
  STOCK_LOT: 'Stock Lots',
  BULK_IMPORT: 'Bulk Import',
  BARCODE: 'Barcode Settings',
};

const MODULE_COLORS: Record<string, string> = {
  WAREHOUSE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  GRN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ISSUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  TRANSFER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  ADJUSTMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  OPENING_STOCK: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  USER: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  PRODUCT: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  STOCK_LOT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  BULK_IMPORT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  BARCODE: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const ALL_ENTITY_TYPES = Object.keys(ENTITY_LABELS);

const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  created_at: string;
  actor_user_id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
}

interface CompanyMember {
  user_id: string;
  role: string;
  user: {
    email: string;
    fullName: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

function getRecordName(entry: AuditLogEntry): string | null {
  const meta = entry.metadata;
  if (!meta) return null;
  return (
    meta.productName ||
    meta.product_name ||
    meta.warehouseName ||
    meta.warehouse_name ||
    meta.userName ||
    meta.user_name ||
    meta.email ||
    meta.grnNumber ||
    meta.grn_number ||
    meta.issueNumber ||
    meta.issue_number ||
    meta.transferNumber ||
    meta.transfer_number ||
    meta.poNumber ||
    meta.po_number ||
    meta.invoiceNumber ||
    meta.filename ||
    meta.fileName ||
    meta.name ||
    null
  );
}

function getRecordIdentifier(entry: AuditLogEntry): string | null {
  const meta = entry.metadata;
  if (!meta) return null;
  return (
    meta.sku ||
    meta.SKU ||
    meta.invoiceNumber ||
    meta.invoice_number ||
    meta.poNumber ||
    meta.po_number ||
    meta.grnNumber ||
    meta.grn_number ||
    meta.issueNumber ||
    meta.issue_number ||
    meta.transferNumber ||
    meta.transfer_number ||
    meta.barcode ||
    null
  );
}

function getChanges(
  meta: any,
): Array<{ field: string; oldValue: string; newValue: string }> | null {
  if (!meta) return null;
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

  // Check for explicit changes array
  if (Array.isArray(meta.changes)) {
    for (const c of meta.changes) {
      changes.push({
        field: c.field || c.key || 'Unknown',
        oldValue: String(c.old ?? c.oldValue ?? c.from ?? '—'),
        newValue: String(c.new ?? c.newValue ?? c.to ?? '—'),
      });
    }
    return changes.length > 0 ? changes : null;
  }

  // Check for before/after style
  if (meta.before && meta.after) {
    const allKeys = new Set([...Object.keys(meta.before), ...Object.keys(meta.after)]);
    for (const key of allKeys) {
      const oldVal = meta.before[key];
      const newVal = meta.after[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          oldValue: oldVal != null ? String(oldVal) : '—',
          newValue: newVal != null ? String(newVal) : '—',
        });
      }
    }
    return changes.length > 0 ? changes : null;
  }

  // Check for old_*/new_* pattern
  const oldKeys = Object.keys(meta).filter((k) => k.startsWith('old_') || k.startsWith('old'));
  for (const ok of oldKeys) {
    const field = ok.replace(/^old_?/, '');
    const nk =
      meta[`new_${field}`] !== undefined
        ? `new_${field}`
        : meta[`new${field.charAt(0).toUpperCase() + field.slice(1)}`] !== undefined
          ? `new${field.charAt(0).toUpperCase() + field.slice(1)}`
          : null;
    if (nk) {
      changes.push({
        field,
        oldValue: String(meta[ok] ?? '—'),
        newValue: String(meta[nk] ?? '—'),
      });
    }
  }

  return changes.length > 0 ? changes : null;
}

function getBulkImportInfo(
  meta: any,
): { fileName: string; totalRows: number; validRows: number; errorRows: number } | null {
  if (!meta) return null;
  if (meta.fileName || meta.filename || meta.totalRows != null || meta.total_rows != null) {
    return {
      fileName: meta.fileName || meta.filename || 'Unknown file',
      totalRows: meta.totalRows ?? meta.total_rows ?? 0,
      validRows: meta.validRows ?? meta.valid_rows ?? meta.successRows ?? 0,
      errorRows: meta.errorRows ?? meta.error_rows ?? meta.failedRows ?? 0,
    };
  }
  return null;
}

function matchesSearch(entry: AuditLogEntry, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  const recordName = getRecordName(entry);
  const recordId = getRecordIdentifier(entry);

  return (
    entry.actor_email.toLowerCase().includes(s) ||
    (entry.actor_role || '').toLowerCase().includes(s) ||
    ACTION_LABELS[entry.action]?.toLowerCase().includes(s) ||
    entry.action.toLowerCase().includes(s) ||
    ENTITY_LABELS[entry.entity_type]?.toLowerCase().includes(s) ||
    (entry.entity_id || '').toLowerCase().includes(s) ||
    (recordName || '').toLowerCase().includes(s) ||
    (recordId || '').toLowerCase().includes(s) ||
    JSON.stringify(entry.metadata || '')
      .toLowerCase()
      .includes(s)
  );
}

function excelText(value: string): string {
  // Force Excel to treat the value as text (prevents ##### display for date/time columns).
  return value ? `'${value}` : '';
}

function formatMetadataForCsv(metadata: unknown): string {
  if (metadata == null) return '';

  let value: unknown = metadata;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try {
      value = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  const pairs: Array<[string, string]> = [];

  const addPair = (key: string, v: unknown) => {
    if (v == null) return;
    if (typeof v === 'string' && !v.trim()) return;

    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      pairs.push([key, String(v)]);
      return;
    }

    if (Array.isArray(v)) {
      pairs.push([
        key,
        v
          .map((x) => (x == null ? '' : String(x)))
          .filter(Boolean)
          .join('|'),
      ]);
      return;
    }

    if (typeof v === 'object') {
      try {
        pairs.push([key, JSON.stringify(v)]);
      } catch {
        pairs.push([key, String(v)]);
      }
    }
  };

  if (typeof value === 'object' && value && !Array.isArray(value)) {
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      addPair(k, (value as Record<string, unknown>)[k]);
    }
  } else {
    addPair('details', value);
  }

  return pairs.map(([k, v]) => `${k}=${v}`).join('; ');
}

function exportToCSV(entries: AuditLogEntry[]) {
  const headers = [
    'Date & Time',
    'User Email',
    'User Role',
    'Action',
    'Module',
    'Record ID',
    'Record Name',
    'SKU / Reference',
    'IP Address',
    'Browser',
    'Details',
  ];

  const rows = entries.map((e) => [
    excelText(format(new Date(e.created_at), 'yyyy-MM-dd HH:mm:ss')),
    e.actor_email,
    e.actor_role,
    ACTION_LABELS[e.action] || e.action,
    ENTITY_LABELS[e.entity_type] || e.entity_type,
    e.entity_id || '',
    getRecordName(e) || '',
    getRecordIdentifier(e) || '',
    e.ip_address || '',
    parseUserAgent(e.user_agent),
    formatMetadataForCsv(e.metadata),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Components ───────────────────────────────────────────────────────────────

function AuditLogSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function ChangesDiff({
  changes,
}: {
  changes: Array<{ field: string; oldValue: string; newValue: string }>;
}) {
  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Activity className="h-3.5 w-3.5" />
        Changes (Before → After)
      </div>
      <div className="divide-y divide-border">
        {changes.map((c, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
            <span className="font-medium text-foreground min-w-28 capitalize">
              {c.field.replace(/_/g, ' ')}
            </span>
            <span className="text-red-600 dark:text-red-400 line-through">{c.oldValue}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-green-600 dark:text-green-400 font-medium">{c.newValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulkImportDetails({
  info,
}: {
  info: { fileName: string; totalRows: number; validRows: number; errorRows: number };
}) {
  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        Bulk Import Summary
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">File Name</p>
          <p className="text-sm font-medium text-foreground truncate">{info.fileName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Rows</p>
          <p className="text-sm font-medium text-foreground">{info.totalRows}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Valid Rows</p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">{info.validRows}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Error Rows</p>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{info.errorRows}</p>
        </div>
      </div>
    </div>
  );
}

function MetadataDetails({ metadata }: { metadata: any }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  // Filter out keys already shown elsewhere
  const skipKeys = new Set([
    'changes',
    'before',
    'after',
    'fileName',
    'filename',
    'totalRows',
    'total_rows',
    'validRows',
    'valid_rows',
    'errorRows',
    'error_rows',
    'successRows',
    'failedRows',
  ]);

  const entries = Object.entries(metadata).filter(
    ([key]) => !skipKeys.has(key) && !key.startsWith('old_') && !key.startsWith('new_'),
  );

  if (entries.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Info className="h-3.5 w-3.5" />
        Additional Details
      </div>
      <div className="divide-y divide-border">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-3 px-4 py-2.5 text-sm">
            <span className="font-medium text-foreground min-w-28 capitalize">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-muted-foreground break-all">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogRow({
  entry,
  expanded,
  onToggle,
  memberMap,
}: {
  entry: AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
  memberMap: Map<string, CompanyMember>;
}) {
  const member = memberMap.get(entry.actor_user_id);
  const actorName = member?.user?.fullName || entry.actor_email.split('@')[0];
  const recordName = getRecordName(entry);
  const recordIdentifier = getRecordIdentifier(entry);
  const changes = getChanges(entry.metadata);
  const bulkInfo =
    entry.action === 'BULK_IMPORT_COMPLETED' || entry.action === 'BULK_IMPORT_STARTED'
      ? getBulkImportInfo(entry.metadata)
      : null;
  const hasDetails =
    changes || bulkInfo || (entry.metadata && Object.keys(entry.metadata).length > 0);
  const isSuccess = entry.metadata?.status !== 'failed';

  return (
    <div className="border border-border rounded-lg hover:border-primary/30 transition-colors">
      {/* Main row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-start gap-4 cursor-pointer"
      >
        {/* Timestamp */}
        <div className="shrink-0 pt-0.5">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Action line */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {ACTION_LABELS[entry.action] || entry.action}
            </span>

            {/* Status badge */}
            {entry.metadata?.status === 'failed' ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <AlertCircle className="h-3 w-3 mr-0.5" />
                Failed
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
              >
                <CheckCircle2 className="h-3 w-3 mr-0.5" />
                Success
              </Badge>
            )}
          </div>

          {/* Who */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="font-medium">{actorName}</span>
            <span>({entry.actor_email})</span>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[entry.actor_role?.toUpperCase()] || ROLE_COLORS.STAFF}`}
            >
              {entry.actor_role}
            </Badge>
          </div>

          {/* Record info */}
          {(recordName || entry.entity_id) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {recordName && <span className="font-medium text-foreground">{recordName}</span>}
              {recordIdentifier && (
                <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                  {recordIdentifier}
                </span>
              )}
              {entry.entity_id && !recordIdentifier && (
                <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                  ID: {entry.entity_id}
                </span>
              )}
            </div>
          )}

          {/* Error message */}
          {entry.metadata?.status === 'failed' && entry.metadata?.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Error: {entry.metadata.error}
            </p>
          )}
        </div>

        {/* Right side info */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {/* Module badge */}
          <Badge
            className={`text-[10px] px-2 py-0.5 ${MODULE_COLORS[entry.entity_type] || 'bg-gray-100 text-gray-800'}`}
          >
            {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
          </Badge>

          {/* Timestamp */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(entry.created_at), 'MMM dd, yyyy  HH:mm')}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{format(new Date(entry.created_at), 'EEEE, MMMM do yyyy, HH:mm:ss')}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Expand icon */}
          {hasDetails && (
            <span className="text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
          {/* Device / IP info */}
          {(entry.ip_address || entry.user_agent) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {entry.ip_address && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  IP: {entry.ip_address}
                </span>
              )}
              {entry.user_agent && (
                <span className="flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Browser: {parseUserAgent(entry.user_agent)}
                </span>
              )}
            </div>
          )}

          {/* Before vs After changes */}
          {changes && <ChangesDiff changes={changes} />}

          {/* Bulk import details */}
          {bulkInfo && <BulkImportDetails info={bulkInfo} />}

          {/* Other metadata */}
          <MetadataDetails metadata={entry.metadata} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AuditLogPageContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Queries
  const { data: companyData } = useCompanyBySlug(slug);

  const companyId = companyData?.companyBySlug?.id;

  const filters = useMemo(() => {
    const f: any = {};
    if (actionFilter !== 'all') f.action = actionFilter;
    if (entityFilter !== 'all') f.entityType = entityFilter;
    if (userFilter !== 'all') f.actorUserId = userFilter;
    if (dateRange?.from) f.dateFrom = dateRange.from.toISOString();
    if (dateRange?.to) f.dateTo = dateRange.to.toISOString();
    return Object.keys(f).length > 0 ? f : undefined;
  }, [actionFilter, entityFilter, userFilter, dateRange]);

  const { data, loading, error, refetch } = useCompanyAuditLogs({
    filters,
    pagination: { page, limit: PAGE_SIZE },
  });

  const { data: membersData } = useCompanyMembers(companyId || '');

  // Build member map
  const memberMap = useMemo(() => {
    const map = new Map<string, CompanyMember>();
    if (membersData?.companyMembers) {
      for (const m of membersData.companyMembers) {
        map.set(m.user_id, m);
      }
    }
    return map;
  }, [membersData]);

  // All entries from server
  const allEntries: AuditLogEntry[] = data?.companyAuditLogs?.items || [];
  const pageInfo = data?.companyAuditLogs?.pageInfo;

  // Client-side search filter
  const filteredEntries = useMemo(
    () => allEntries.filter((e) => matchesSearch(e, search)),
    [allEntries, search],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (actionFilter !== 'all') count++;
    if (entityFilter !== 'all') count++;
    if (userFilter !== 'all') count++;
    if (dateRange?.from) count++;
    return count;
  }, [actionFilter, entityFilter, userFilter, dateRange]);

  const clearFilters = useCallback(() => {
    setActionFilter('all');
    setEntityFilter('all');
    setUserFilter('all');
    setDateRange(undefined);
    setSearch('');
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    exportToCSV(filteredEntries);
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href={`/${slug}/settings`} className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go back
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
                <p className="text-sm text-muted-foreground">
                  Read-only history of all actions across your company
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((v) => !v)}
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filteredEntries.length === 0}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="SKU, product name, email, invoice..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Module filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Module
                  </label>
                  <Select
                    value={entityFilter}
                    onValueChange={(v) => {
                      setEntityFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {ALL_ENTITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ENTITY_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Action
                  </label>
                  <Select
                    value={actionFilter}
                    onValueChange={(v) => {
                      setActionFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {ALL_ACTIONS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    User
                  </label>
                  <Select
                    value={userFilter}
                    onValueChange={(v) => {
                      setUserFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {membersData?.companyMembers?.map((m: CompanyMember) => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.user?.fullName || m.user?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date range row */}
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Date Range
                  </label>
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={(d) => {
                      setDateRange(d);
                      setPage(1);
                    }}
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary bar */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>
              {loading ? 'Loading...' : `${pageInfo?.total ?? 0} total entries`}
              {search && ` · ${filteredEntries.length} matching "${search}"`}
            </span>
          </div>
          {pageInfo && (
            <span>
              Page {pageInfo.page} of {Math.ceil(pageInfo.total / pageInfo.limit) || 1}
            </span>
          )}
        </div>

        {/* Log entries */}
        {loading && !data ? (
          <AuditLogSkeleton />
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
              <p className="text-destructive font-medium">Failed to load audit logs</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground">No audit entries found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {activeFilterCount > 0 || search
                  ? 'Try adjusting your filters or search query.'
                  : 'Audit log entries will appear here as actions are performed.'}
              </p>
              {(activeFilterCount > 0 || search) && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <AuditLogRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
                memberMap={memberMap}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageInfo && pageInfo.total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!pageInfo.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, Math.ceil(pageInfo.total / pageInfo.limit)) },
                (_, i) => {
                  const totalPages = Math.ceil(pageInfo.total / pageInfo.limit);
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!pageInfo.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Read-only notice */}
        <div className="text-center py-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          Audit logs are read-only and cannot be modified or deleted.
        </div>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <RoleGuard allowedRoles={['OWNER', 'ADMIN']}>
      <AuditLogPageContent />
    </RoleGuard>
  );
}
