'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_ISSUE_NOTES_BY_WAREHOUSE } from '@/lib/graphql/issues';
import { ArrowUpDown, Loader2, Plus, Search } from 'lucide-react';
import { CreateIssueModal } from '@/components/issues/CreateIssueModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/sales/StatusBadge';
import { useWarehouse } from '@/context/warehouse-context';
import { format } from 'date-fns';

export default function IssueNotesPage() {
  const params = useParams();
  const { activeWarehouse } = useWarehouse();
  const companySlug = params.slug as string;
  const warehouseSlug = params.warehouseSlug as string;

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ISSUE_NOTES_BY_WAREHOUSE, {
    variables: { warehouseId: activeWarehouse?.id },
    skip: !activeWarehouse?.id,
  });

  const issueNotes = data?.issueNotesByWarehouse || [];

  const filteredNotes = issueNotes.filter((note: any) => {
    const matchesStatus = statusFilter === 'ALL' || note.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      (note.sales_order?.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Issue Notes
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track goods issued from {activeWarehouse?.name || 'warehouse'}
              </p>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Issue
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Issue Notes Table with Filters */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">
                  Loading issue notes...
                </span>
              </div>
            ) : error ? (
              <div className="text-center space-y-3 py-12">
                <p className="text-sm text-red-600">Failed to load issue notes</p>
                <Button onClick={() => refetch()} variant="outline">
                  Retry
                </Button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 w-fit mx-auto mb-4">
                  <ArrowUpDown className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No issue notes found</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Create an issue note to start tracking goods issued.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-2">Issue #</TableHead>
                      <TableHead>Linked Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes.map((note: any) => (
                      <TableRow key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-mono text-sm font-semibold pl-2">
                          {note.issue_number}
                        </TableCell>
                        <TableCell>
                          {note.sales_order ? (
                            <Link
                              href={`/${companySlug}/sales/orders/${note.sales_order.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {note.sales_order.order_number || note.sales_order.customer_name}
                            </Link>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              📦 Direct Issue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={note.status} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {note.items?.length || 0} items
                        </TableCell>
                        <TableCell>{note.issuer?.fullName || '-'}</TableCell>
                        <TableCell>
                          {note.issued_at
                            ? format(new Date(note.issued_at), 'dd MMM yyyy')
                            : format(new Date(note.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/${companySlug}/warehouses/${warehouseSlug}/issues/${note.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Issue Modal */}
        <CreateIssueModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => refetch()}
        />
      </main>
    </div>
  );
}
