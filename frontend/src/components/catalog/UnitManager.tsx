'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_UNITS, CREATE_UNIT, DELETE_UNIT } from '@/lib/graphql/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitManager() {
  const { data, loading, error, refetch } = useQuery(GET_UNITS);
  const [createUnit, { loading: creating }] = useMutation(CREATE_UNIT);
  const [removeUnit] = useMutation(DELETE_UNIT);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUnit({
        variables: {
          input: { name, shortCode, isDefault: false },
        },
      });
      toast.success('Unit created successfully');
      setIsOpen(false);
      setName('');
      setShortCode('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create unit');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await removeUnit({ variables: { id } });
      toast.success('Unit deleted');
      refetch();
    } catch (err: any) {
      toast.error('Failed to delete unit');
    }
  };

  if (loading) return <div>Loading units...</div>;
  if (error) return <div>Error loading units</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Units of Measure</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Unit Name (e.g., Kilogram)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Short Code (e.g., kg)</Label>
                <Input value={shortCode} onChange={(e) => setShortCode(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                  No units defined.
                </TableCell>
              </TableRow>
            ) : (
              data?.units.map((unit: any) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell>{unit.shortCode}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unit.id, unit.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
