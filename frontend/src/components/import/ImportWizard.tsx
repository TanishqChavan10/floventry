'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
} from 'lucide-react';
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
import { parsePlainTextCategories, parsePlainTextProducts, parsePlainTextSuppliers, detectInputFormat } from '@/lib/utils/plainTextParser';
import { parseCsvForPreview } from '@/lib/utils/csvParser';
import { ImportPreview } from '@/components/import/PlainTextPreview';

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

type InputMethod = 'upload' | 'paste' | 'plaintext';

const SOFT_MAX_ROWS = 1000;

function estimateCsvDataRowCount(csv: string): number {
  // Soft check only; doesn't fully parse quoted CSV.
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length <= 1) return 0;
  return Math.max(0, lines.length - 1); // subtract header
}

function escapeCsvField(value: string): string {
  const mustQuote = /[\n\r",]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

function tsvToCsv(tsv: string): string {
  const rows = tsv
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((r) => r.trim().length > 0);
  const csvLines = rows.map((row) => row.split('\t').map(escapeCsvField).join(','));
  return csvLines.join('\n');
}

function buildErrorCsv(errors: ValidationError[]): string {
  const header = ['rowNumber', 'field', 'message'].join(',');
  const lines = errors.map((e) =>
    [String(e.rowNumber ?? ''), e.field ?? '', e.message ?? '']
      .map((v) => escapeCsvField(String(v)))
      .join(','),
  );
  return [header, ...lines].join('\n');
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
  const supportsPaste: boolean = type !== 'opening_stock';
  const supportsPlainText: boolean = type === 'categories' || type === 'products' || type === 'suppliers';
  const [inputMethod, setInputMethod] = useState<InputMethod>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<'plain' | 'csv' | 'tsv' | null>(null);
  const [plainTextPreview, setPlainTextPreview] = useState<any>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);

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

  const resolveCsvContentForValidation = (): { content: string; name: string } => {
    if (supportsPlainText && inputMethod === 'plaintext') {
      const trimmed = pastedText.trim();
      const parsed = type === 'categories'
        ? parsePlainTextCategories(trimmed)
        : type === 'products'
        ? parsePlainTextProducts(trimmed)
        : parsePlainTextSuppliers(trimmed);
      return { content: parsed.csvContent, name: 'plaintext.csv' };
    }
    if (supportsPaste && inputMethod === 'paste') {
      const trimmed = pastedText.trim();
      const content = trimmed.includes('\t') ? tsvToCsv(trimmed) : trimmed;
      return { content, name: 'pasted.csv' };
    }
    return { content: csvContent, name: fileName || 'upload.csv' };
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleValidate = async () => {
    try {
      const resolved = resolveCsvContentForValidation();
      const normalized = resolved.content.trim();
      if (!normalized) {
        toast({
          title: 'No data to validate',
          description:
            supportsPaste && inputMethod === 'paste'
              ? 'Paste your rows first, or switch to CSV upload.'
              : 'Choose a CSV file first.',
          variant: 'destructive',
        });
        return;
      }

      // Persist for the next steps
      setCsvContent(normalized);
      setFileName(resolved.name);

      const dataRowCount = estimateCsvDataRowCount(normalized);
      if (dataRowCount > SOFT_MAX_ROWS) {
        toast({
          title: 'Large import',
          description: `You have ${dataRowCount} rows. Recommended max is ${SOFT_MAX_ROWS} for best performance.`,
        });
      }

      const variables: any = { csvContent: normalized };
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
    setInputMethod('upload');
    setPastedText('');
    setValidationResult(null);
    setImportResult(null);
    setDetectedFormat(null);
    setPlainTextPreview(null);
    setCsvPreview(null);
  };

  // Auto-parse and preview based on input method
  useEffect(() => {
    // Plain text parsing
    if (inputMethod === 'plaintext' && pastedText.trim()) {
      const format = detectInputFormat(pastedText);
      setDetectedFormat(format);
      
      const parsed = type === 'categories'
        ? parsePlainTextCategories(pastedText)
        : type === 'products'
        ? parsePlainTextProducts(pastedText)
        : parsePlainTextSuppliers(pastedText);
      setPlainTextPreview(parsed);
      setCsvPreview(null);
    }
    // CSV/TSV preview for paste
    else if (inputMethod === 'paste' && pastedText.trim()) {
      const content = pastedText.includes('\t') ? tsvToCsv(pastedText) : pastedText;
      const parsed = parseCsvForPreview(content);
      setCsvPreview(parsed);
      setPlainTextPreview(null);
    }
    // CSV preview for upload
    else if (inputMethod === 'upload' && csvContent.trim()) {
      const parsed = parseCsvForPreview(csvContent);
      setCsvPreview(parsed);
      setPlainTextPreview(null);
    }
    else {
      setDetectedFormat(null);
      setPlainTextPreview(null);
      setCsvPreview(null);
    }
  }, [pastedText, inputMethod, type, csvContent]);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-3 min-w-[520px] pr-2">
          <div
            className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-slate-600'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
            >
              1
            </div>
            <span className="font-medium">Upload</span>
          </div>

          <div className="hidden sm:block w-10 h-px bg-slate-300" />

          <div
            className={`flex items-center gap-2 ${step === 'validate' ? 'text-blue-600' : 'text-slate-600'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'validate' || step === 'confirm' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
            >
              2
            </div>
            <span className="font-medium">Validate</span>
          </div>

          <div className="hidden sm:block w-10 h-px bg-slate-300" />

          <div
            className={`flex items-center gap-2 ${step === 'confirm' ? 'text-blue-600' : 'text-slate-600'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}
            >
              3
            </div>
            <span className="font-medium">Confirm</span>
          </div>

          <div className="hidden sm:block w-10 h-px bg-slate-300" />

          <div
            className={`flex items-center gap-2 ${step === 'complete' ? 'text-green-600' : 'text-slate-600'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-600 text-white' : 'bg-slate-200'}`}
            >
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
            <CardTitle>Bulk Entry</CardTitle>
            <CardDescription>
              Add many {IMPORT_LABELS[type].toLowerCase()} at once via CSV upload or paste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>First time?</strong> Download the template to see the required format.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>

                {(!supportsPaste || inputMethod === 'upload') && (
                  <>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button variant="default" asChild>
                        <span className="cursor-pointer inline-flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          Choose CSV File
                        </span>
                      </Button>
                    </label>
                  </>
                )}
              </div>

              {supportsPaste && (
                <div className="rounded-lg border p-3">
                  <RadioGroup
                    value={inputMethod}
                    onValueChange={(value) => setInputMethod(value as InputMethod)}
                    className="flex flex-row gap-6 flex-wrap"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upload" id="import-method-upload" />
                      <Label htmlFor="import-method-upload">Upload CSV</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paste" id="import-method-paste" />
                      <Label htmlFor="import-method-paste">Paste from Sheets</Label>
                    </div>
                    {supportsPlainText && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="plaintext" id="import-method-plaintext" />
                        <Label htmlFor="import-method-plaintext">Plain Text Smart Paste</Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}
            </div>

            {supportsPaste && inputMethod === 'paste' && (
              <div className="space-y-2">
                <Label>Paste rows (include the header row)</Label>
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste from Excel/Google Sheets. Tabs and newlines are supported."
                  className="min-h-[160px] font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Tip: Paste directly from the downloaded template to keep the columns correct.
                </p>
              </div>
            )}

            {supportsPlainText && inputMethod === 'plaintext' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>
                    {type === 'categories' 
                      ? 'Paste categories (one per line)' 
                      : type === 'products'
                      ? 'Paste products (one per line)'
                      : 'Paste suppliers (one per line)'}
                  </Label>
                  <Textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={
                      type === 'categories'
                        ? `Fruits & Vegetables - Fresh produce items\nDairy & Bakery - Milk and baked goods\nSnacks & Confectionery\nBeverages - Drinks and refreshments`
                        : type === 'products'
                        ? `PROD-001 | Laptop | pcs | High-performance laptop\nPROD-002 | Mouse | pcs | Wireless mouse\nPROD-003 | Keyboard | pcs`
                        : `ABC Suppliers Ltd | sales@abc.com | +91-9876543210 | 123 Business Street\nXYZ Corp - contact@xyz.com - +91-9876543211 - 456 Trade Park\nGlobal Traders`
                    }
                    className="min-h-[180px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    {type === 'categories' ? (
                      <>
                        Optional description after <code className="bg-muted px-1 py-0.5 rounded">-</code>
                        <br />
                        Example: <code className="bg-muted px-1 py-0.5 rounded text-xs">Fruits & Vegetables - Fresh produce items</code>
                      </>
                    ) : type === 'products' ? (
                      <>
                        <strong>Simple:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">SKU | Name | Unit | Description</code>
                        <br />
                        <strong>Extended:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">SKU | Name | Unit | Barcode | Category | Supplier | Cost | Selling | Description</code>
                      </>
                    ) : (
                      <>
                        Format: <code className="bg-muted px-1 py-0.5 rounded">Name | Email | Phone | Address</code> or <code className="bg-muted px-1 py-0.5 rounded">Name - Email - Phone - Address</code>
                        <br />
                        Example: <code className="bg-muted px-1 py-0.5 rounded text-xs">ABC Suppliers Ltd | sales@abc.com | +91-9876543210 | 123 Business Street</code>
                      </>
                    )}
                  </p>
                </div>
                
                {plainTextPreview && plainTextPreview.categories.length > 0 && (
                  <ImportPreview 
                    type={type as any}
                    rows={plainTextPreview.categories.map((c: any) => ({
                      data: c,
                      lineNumber: c.lineNumber,
                      isEmpty: c.isEmpty
                    }))}
                  />
                )}

                {csvPreview && csvPreview.rows.length > 0 && (
                  <ImportPreview 
                    type={type as any}
                    rows={csvPreview.rows}
                  />
                )}
              </div>
            )}

            {(fileName ||
              (supportsPaste && inputMethod === 'paste' && pastedText.trim().length > 0) ||
              (supportsPlainText && inputMethod === 'plaintext' && plainTextPreview && plainTextPreview.categories.length > 0 && !plainTextPreview.hasErrors)) && (
              <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">
                      {inputMethod === 'plaintext'
                        ? `${plainTextPreview?.categories.length || 0} ${type === 'categories' ? 'categories' : type === 'products' ? 'products' : 'suppliers'} ready`
                        : supportsPaste && inputMethod === 'paste'
                        ? 'Pasted data'
                        : fileName}
                    </span>
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
            <CardDescription>Review validation results before importing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                <div className="text-sm text-slate-600">Total Rows</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.validRows.length}
                </div>
                <div className="text-sm text-slate-600">Valid Rows</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.errorRows.length}
                </div>
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
                      )),
                    )}
                  </TableBody>
                </Table>
                {validationResult.errorRows.length > 10 && (
                  <p className="text-sm text-slate-600 mt-2">
                    ... and {validationResult.errorRows.length - 10} more errors
                  </p>
                )}

                <div className="mt-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const flatErrors = validationResult.errorRows.flatMap((r) => r.errors);
                      downloadCsv(`${type}_validation_errors.csv`, buildErrorCsv(flatErrors));
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Error Report
                  </Button>
                </div>
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
            <CardDescription>Review and confirm the import operation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This action cannot be undone.</strong> You are about to create{' '}
                {validationResult.validRows.length} {IMPORT_LABELS[type].toLowerCase()}.
                {validationResult.errorRows.length > 0 && (
                  <>
                    {' '}
                    {validationResult.errorRows.length} will be skipped due to validation errors.
                  </>
                )}
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
            <CardDescription>Your data has been successfully imported</CardDescription>
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

            {importResult.failureCount > 0 && importResult.errors?.length > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(`${type}_import_errors.csv`, buildErrorCsv(importResult.errors))
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </Button>
            )}

            <div className="flex gap-3">
              <Button onClick={reset}>Import More {IMPORT_LABELS[type]}</Button>
              {onComplete && (
                <Button variant="outline" onClick={onComplete}>
                  Done
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
