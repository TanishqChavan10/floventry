'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { GET_ISSUE_NOTES_BY_WAREHOUSE } from '@/lib/graphql/issues';
import { Loader2, Plus, Search } from 'lucide-react';
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
      (note.sales_order?.customer_name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading issue notes: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold tracking-tight">Issue Notes</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Track goods issued from warehouse
          </p>
        </div>
        <Button className="gap-2" size="lg" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Issue
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="POSTED">Posted</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Cards - Moved above table for better visual flow */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{issueNotes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {issueNotes.filter((n: any) => n.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Posted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {issueNotes.filter((n: any) => n.status === 'POSTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issue Notes Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Issue Notes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Issue #</TableHead>
                <TableHead>Linked Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium">No issue notes found</p>
                      <p className="text-sm text-slate-400">
                        Create your first issue note to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotes.map((note: any) => (
                  <TableRow key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableCell className="font-mono text-sm font-semibold pl-6">
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
                    <TableCell className="font-medium">{note.items?.length || 0} items</TableCell>
                    <TableCell>{note.issuer?.fullName || '-'}</TableCell>
                    <TableCell>
                      {note.issued_at
                        ? format(new Date(note.issued_at), 'dd MMM yyyy')
                        : format(new Date(note.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Link href={`/${companySlug}/warehouses/${warehouseSlug}/issues/${note.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
