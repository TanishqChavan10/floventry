'use client';

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"

interface DangerZoneProps {
  companyId: string;
}

export function DangerZone({ companyId }: DangerZoneProps) {
  const handleDeleteCompany = async () => {
    // Implement delete logic here
    toast.error("Deletion not implemented yet for safety.");
  };

  return (
    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        <CardDescription className="text-red-800 dark:text-red-300">
          Destructive actions that cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-white dark:bg-slate-900/50">
          <div>
            <h4 className="font-medium text-slate-900 dark:text-white">Delete Company</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Permanently delete this company and all its data.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Company
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your company
                    and remove your data from our servers.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCompany} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
