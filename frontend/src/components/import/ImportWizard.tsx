'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, CheckCircle, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DOWNLOAD_PRODUCT_TEMPLATE,
  DOWNLOAD_CATEGORY_TEMPLATE,
  DOWNLOAD_SUPPLIER_TEMPLATE,
  DOWNLOAD_OPENING_STOCK_TEMPLATE,
  VALIDATE_PRODUCT_IMPORT,
  VALIDATE_CATEGORY_IMPORT,
  VALIDATE_SUPPLIER_IMPORT,
  VALIDATE_OPENING_STOCK_IMPORT,
  EXECUTE_PRODUCT_IMPORT,
  EXECUTE_CATEGORY_IMPORT,
  EXECUTE_SUPPLIER_IMPORT,
  EXECUTE_OPENING_STOCK_IMPORT,
} from '@/lib/graphql/import';

type ImportType = 'products' | 'categories' | 'suppliers' | 'opening_stock';

interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

interface ValidatedRow {
  rowNumber: number;
  data: any;
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationResult {
  validRows: ValidatedRow[];
  errorRows: ValidatedRow[];
  totalRows: number;
}

interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
}

interface ImportWizardProps {
  type: ImportType;
  warehouseId?: string;
  onComplete?: () => void;
}

const IMPORT_LABELS = {
  products: 'Products',
  categories: 'Categories',
  suppliers: 'Suppliers',
  opening_stock: 'Opening Stock',
};

export function ImportWizard({ type, warehouseId, onComplete }: ImportWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'validate' | 'confirm' | 'complete'>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Template download mutations
  const templateMutations = {
    products: DOWNLOAD_PRODUCT_TEMPLATE,
    categories: DOWNLOAD_CATEGORY_TEMPLATE,
    suppliers: DOWNLOAD_SUPPLIER_TEMPLATE,
    opening_stock: DOWNLOAD_OPENING_STOCK_TEMPLATE,
  };

  // Validation mutations
  const validationMutations = {
    products: VALIDATE_PRODUCT_IMPORT,
    categories: VALIDATE_CATEGORY_IMPORT,
    suppliers: VALIDATE_SUPPLIER_IMPORT,
    opening_stock: VALIDATE_OPENING_STOCK_IMPORT,
  };

  // Execution mutations
  const executionMutations = {
    products: EXECUTE_PRODUCT_IMPORT,
    categories: EXECUTE_CATEGORY_IMPORT,
    suppliers: EXECUTE_SUPPLIER_IMPORT,
    opening_stock: EXECUTE_OPENING_STOCK_IMPORT,
  };

  const [downloadTemplate] = useMutation(templateMutations[type]);
  const [validateImport, { loading: validating }] = useMutation(validationMutations[type]);
  const [executeImport, { loading: executing }] = useMutation(executionMutations[type]);

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await downloadTemplate();
      const csvData = Object.values(data)[0] as string;
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_template.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Template Downloaded',
        description: `${IMPORT_LABELS[type]} template has been downloaded`,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setFileName(file.name);
      setStep('upload');
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    try {
      const variables: any = { csvContent };
      if (type === 'opening_stock' && warehouseId) {
        variables.warehouseId = warehouseId;
      }

      const { data } = await validateImport({ variables });
      const result = JSON.parse(Object.values(data)[0] as string) as ValidationResult;
      
      setValidationResult(result);
      setStep('validate');

      if (result.errorRows.length === 0) {
        toast({
          title: 'Validation Successful',
          description: `All ${result.totalRows} rows are valid!`,
        });
      } else {
        toast({
          title: 'Validation Complete',
          description: `${result.validRows.length} valid, ${result.errorRows.length} errors`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Validation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;

    try {
      const variables: any = {
        validatedData: JSON.stringify(validationResult.validRows),
      };
      if (type === 'opening_stock' && warehouseId) {
        variables.warehouseId = warehouseId;
      }

      const { data } = await executeImport({ variables });
      const result = JSON.parse(Object.values(data)[0] as string) as ImportResult;
      
      setImportResult(result);
      setStep('complete');

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} records`,
      });

      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const reset = () => {
    setStep('upload');
    setCsvContent('');
    setFileName('');
    setValidationResult(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-slate-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              1
            </div>
            <span className="font-medium">Upload</span>
          </div>
          <div className="w-16 h-px bg-slate-300" />
          <div className={`flex items-center gap-2 ${step === 'validate' ? 'text-blue-600' : 'text-slate-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'validate' || step === 'confirm' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span className="font-medium">Validate</span>
          </div>
          <div className="w-16 h-px bg-slate-300" />
          <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-blue-600' : 'text-slate-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              3
            </div>
            <span className="font-medium">Confirm</span>
          </div>
          <div className="w-16 h-px bg-slate-300" />
          <div className={`flex items-center gap-2 ${step === 'complete' ? 'text-green-600' : 'text-slate-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-600 text-white' : 'bg-slate-200'}`}>
              ✓
            </div>
            <span className="font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload your {IMPORT_LABELS[type]} data as a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>First time?</strong> Download the template to see the required format.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="default" asChild>
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose CSV File
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            {fileName && (
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                  <Button onClick={handleValidate} disabled={validating}>
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Validate & Continue'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validation Results */}
      {step === 'validate' && validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Review validation results before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                <div className="text-sm text-slate-600">Total Rows</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{validationResult.validRows.length}</div>
                <div className="text-sm text-slate-600">Valid Rows</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{validationResult.errorRows.length}</div>
                <div className="text-sm text-slate-600">Error Rows</div>
              </div>
            </div>

            {validationResult.errorRows.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errors Found</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.errorRows.slice(0, 10).map((row) =>
                      row.errors.map((error, idx) => (
                        <TableRow key={`${row.rowNumber}-${idx}`}>
                          <TableCell>{error.rowNumber}</TableCell>
                          <TableCell className="font-mono">{error.field}</TableCell>
                          <TableCell className="text-red-600">{error.message}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {validationResult.errorRows.length > 10 && (
                  <p className="text-sm text-slate-600 mt-2">
                    ... and {validationResult.errorRows.length - 10} more errors
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
              {validationResult.validRows.length > 0 && (
                <Button onClick={() => setStep('confirm')}>
                  Continue with {validationResult.validRows.length} Valid Rows
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Import</CardTitle>
            <CardDescription>
              Review and confirm the import operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> {validationResult.validRows.length} {IMPORT_LABELS[type].toLowerCase()} will be created.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('validate')}>
                Back
              </Button>
              <Button onClick={handleExecute} disabled={executing}>
                {executing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${validationResult.validRows.length} Records`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your data has been successfully imported
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                <div className="text-sm text-slate-600">Successfully Imported</div>
              </div>
              {importResult.failureCount > 0 && (
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failureCount}</div>
                  <div className="text-sm text-slate-600">Failed</div>
                </div>
              )}
            </div>

            <Button onClick={reset}>
              Import More {IMPORT_LABELS[type]}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
