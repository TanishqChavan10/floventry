'use client';

import React from 'react';
import { Loader2, Play, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useExpiryScanStatus, useTriggerExpiryScan } from '@/hooks/apollo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ExpiryScannerCard() {
  const { data, loading, error, refetch } = useExpiryScanStatus();

  const [triggerScan, { loading: scanning }] = useTriggerExpiryScan();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expiry Scanner</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expiry Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load scanner status: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const status = data?.expiryScanStatus;
  if (!status) return null;

  const hasError = !!status.lastErrorAt;
  const lastSuccess = status.lastSuccessAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expiry Scanner</CardTitle>
            <CardDescription>
              Automated daily scan that detects expired and expiring-soon stock lots.
            </CardDescription>
          </div>
          <Badge variant={status.enabled ? 'default' : 'secondary'}>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Status rows */}
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Schedule
            </span>
            <span className="font-medium">Daily at midnight UTC</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Last successful run
            </span>
            <span className="font-medium">
              {lastSuccess ? (
                <span title={formatDateTime(lastSuccess)}>{timeAgo(lastSuccess)}</span>
              ) : (
                '—'
              )}
            </span>
          </div>

          {status.nextRunAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Next run
              </span>
              <span className="font-medium">{formatDateTime(status.nextRunAt)}</span>
            </div>
          )}

          {hasError && (
            <div className="flex items-start justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <span className="text-destructive flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-xs">
                  Last error ({timeAgo(status.lastErrorAt)}): {status.lastErrorMessage}
                </span>
              </span>
            </div>
          )}

          {!status.jobRegistered && (
            <div className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs">
                Cron job not registered — the scanner may not be running.
              </span>
            </div>
          )}
        </div>

        {/* Trigger button */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground max-w-65">
            Manually trigger an expiry scan outside the daily schedule.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={scanning || !status.enabled}
            onClick={() =>
              triggerScan()
                .then((result) => {
                  const scan = result.data?.triggerExpiryScan;
                  if (scan?.success) {
                    toast.success(`Scan complete — ${scan.lotsScanned} lots checked`);
                  } else {
                    toast.error(scan?.message ?? 'Scan failed');
                  }
                  refetch();
                })
                .catch((err) => {
                  toast.error('Scan failed: ' + err.message);
                })
            }
          >
            {scanning ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5" />
            )}
            {scanning ? 'Scanning…' : 'Run Scan Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
