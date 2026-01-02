'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { formatIndianRupee } from '@/lib/formatters';

export interface ExportProgress {
  isExporting: boolean;
  progress: number;
  message: string;
}

export interface ExportOptions {
  filename?: string;
  title?: string;
  includeTimestamp?: boolean;
  customColumns?: { [key: string]: string };
}

export const useExportData = () => {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    message: ''
  });

  const updateProgress = (progress: number, message: string) => {
    setExportProgress({ isExporting: true, progress, message });
  };

  const resetProgress = () => {
    setExportProgress({ isExporting: false, progress: 0, message: '' });
  };

  // CSV Export Function
  const exportToCSV = async (
    data: any[], 
    options: ExportOptions = {}
  ) => {
    try {
      updateProgress(10, 'Preparing data...');
      
      const { 
        filename = 'export', 
        includeTimestamp = true,
        customColumns 
      } = options;

      if (!data || data.length === 0) {
        toast.error('No data available to export');
        resetProgress();
        return;
      }

      updateProgress(30, 'Converting to CSV format...');

      // Apply custom column mapping if provided
      let processedData = data;
      if (customColumns) {
        processedData = data.map(row => {
          const newRow: any = {};
          Object.entries(customColumns).forEach(([oldKey, newKey]) => {
            if (row[oldKey] !== undefined) {
              newRow[newKey] = row[oldKey];
            }
          });
          return newRow;
        });
      }

      updateProgress(60, 'Generating CSV file...');

      // Convert to CSV
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      updateProgress(80, 'Preparing download...');

      // Create filename with timestamp
      const timestamp = includeTimestamp 
        ? new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        : '';
      const finalFilename = `${filename}${timestamp ? `_${timestamp}` : ''}.csv`;

      // Download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, finalFilename);

      updateProgress(100, 'Export completed!');
      
      setTimeout(() => {
        resetProgress();
        toast.success(`CSV exported successfully!`, {
          description: `File: ${finalFilename}`
        });
      }, 500);

    } catch (error) {
      resetProgress();
      console.error('CSV Export Error:', error);
      toast.error('Failed to export CSV file');
    }
  };

  // Excel Export Function
  const exportToExcel = async (
    data: any[] | { [sheetName: string]: any[] }, 
    options: ExportOptions = {}
  ) => {
    try {
      updateProgress(10, 'Preparing Excel data...');
      
      const { 
        filename = 'export', 
        includeTimestamp = true,
        title = 'Export Data'
      } = options;

      updateProgress(30, 'Creating Excel workbook...');

      const workbook = XLSX.utils.book_new();

      if (Array.isArray(data)) {
        // Single sheet export
        if (data.length === 0) {
          toast.error('No data available to export');
          resetProgress();
          return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      } else {
        // Multi-sheet export
        const sheets = Object.keys(data);
        if (sheets.length === 0) {
          toast.error('No data available to export');
          resetProgress();
          return;
        }

        updateProgress(50, 'Adding sheets to workbook...');

        sheets.forEach((sheetName, index) => {
          const sheetData = data[sheetName];
          if (sheetData && sheetData.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          }
          updateProgress(50 + (index / sheets.length) * 30, `Processing ${sheetName}...`);
        });
      }

      updateProgress(80, 'Generating Excel file...');

      // Create filename with timestamp
      const timestamp = includeTimestamp 
        ? new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        : '';
      const finalFilename = `${filename}${timestamp ? `_${timestamp}` : ''}.xlsx`;

      updateProgress(90, 'Preparing download...');

      // Generate Excel file and download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
      });
      saveAs(blob, finalFilename);

      updateProgress(100, 'Export completed!');
      
      setTimeout(() => {
        resetProgress();
        toast.success(`Excel exported successfully!`, {
          description: `File: ${finalFilename}`
        });
      }, 500);

    } catch (error) {
      resetProgress();
      console.error('Excel Export Error:', error);
      toast.error('Failed to export Excel file');
    }
  };

  // PDF Export Function
  const exportToPDF = async (
    data: any[], 
    options: ExportOptions = {}
  ) => {
    try {
      updateProgress(10, 'Preparing PDF data...');
      
      const { 
        filename = 'export', 
        title = 'Export Report',
        includeTimestamp = true 
      } = options;

      if (!data || data.length === 0) {
        toast.error('No data available to export');
        resetProgress();
        return;
      }

      updateProgress(30, 'Creating PDF document...');

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 22);
      
      // Add timestamp
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

      updateProgress(50, 'Processing table data...');

      // Prepare table data
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(header => {
        const value = item[header];
        // Format numbers and currency properly
        if (typeof value === 'number' && header.toLowerCase().includes('amount')) {
          return formatIndianRupee(value);
        }
        return value?.toString() || '';
      }));

      updateProgress(70, 'Generating PDF table...');

      // Add table using autoTable
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [71, 85, 105], // slate-600
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        margin: { top: 40 },
      });

      updateProgress(90, 'Preparing download...');

      // Create filename with timestamp
      const timestamp = includeTimestamp 
        ? new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        : '';
      const finalFilename = `${filename}${timestamp ? `_${timestamp}` : ''}.pdf`;

      // Save PDF
      doc.save(finalFilename);

      updateProgress(100, 'Export completed!');
      
      setTimeout(() => {
        resetProgress();
        toast.success(`PDF exported successfully!`, {
          description: `File: ${finalFilename}`
        });
      }, 500);

    } catch (error) {
      resetProgress();
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF file');
    }
  };

  // Generic export function that handles all formats
  const exportData = async (
    data: any[] | { [sheetName: string]: any[] },
    format: 'csv' | 'excel' | 'pdf',
    options: ExportOptions = {}
  ) => {
    switch (format) {
      case 'csv':
        if (Array.isArray(data)) {
          await exportToCSV(data, options);
        } else {
          // For multi-sheet data, export the first sheet as CSV
          const firstSheet = Object.keys(data)[0];
          await exportToCSV(data[firstSheet], { ...options, filename: `${options.filename || 'export'}_${firstSheet}` });
        }
        break;
      case 'excel':
        await exportToExcel(data, options);
        break;
      case 'pdf':
        if (Array.isArray(data)) {
          await exportToPDF(data, options);
        } else {
          // For multi-sheet data, export the first sheet as PDF
          const firstSheet = Object.keys(data)[0];
          await exportToPDF(data[firstSheet], { ...options, title: `${options.title || 'Export Report'} - ${firstSheet}` });
        }
        break;
      default:
        toast.error('Unsupported export format');
    }
  };

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportData,
    exportProgress,
    isExporting: exportProgress.isExporting
  };
};

// Utility functions for data transformation
export const transformSalesDataForExport = (salesData: any) => {
  const exportData: { [key: string]: any[] } = {};

  // Overview data
  if (salesData?.salesAnalytics?.overview) {
    const overview = salesData.salesAnalytics.overview;
    exportData['Overview'] = [{
      'Metric': 'Total Revenue',
      'Value': formatIndianRupee(overview.totalRevenue)
    }, {
      'Metric': 'Total Transactions',
      'Value': overview.totalTransactions
    }, {
      'Metric': 'Average Order Value',
      'Value': formatIndianRupee(overview.avgOrderValue)
    }, {
      'Metric': 'Growth Rate',
      'Value': `${overview.growthRate}%`
    }];
  }

  // Top Products
  if (salesData?.salesAnalytics?.topProducts) {
    exportData['Top Products'] = salesData.salesAnalytics.topProducts.map((product: any) => ({
      'Product Name': product.product_name,
      'Category': product.category_name,
      'Units Sold': product.total_sold,
      'Revenue': formatIndianRupee(product.revenue),
      'Average Price': formatIndianRupee(product.avg_price),
      'Trend': product.trend
    }));
  }

  // Payment Methods
  if (salesData?.salesAnalytics?.paymentMethods) {
    exportData['Payment Methods'] = salesData.salesAnalytics.paymentMethods.map((method: any) => ({
      'Payment Method': method.method,
      'Transaction Count': method.count,
      'Total Amount': formatIndianRupee(method.total_amount),
      'Percentage': `${method.percentage.toFixed(1)}%`
    }));
  }

  // Revenue by Category
  if (salesData?.salesAnalytics?.revenueByCategory) {
    exportData['Revenue by Category'] = salesData.salesAnalytics.revenueByCategory.map((category: any) => ({
      'Category': category.category,
      'Revenue': formatIndianRupee(category.revenue),
      'Percentage': `${category.percentage.toFixed(1)}%`
    }));
  }

  return exportData;
};

export const transformInventoryDataForExport = (products: any[]) => {
  return products.map(product => ({
    'Product ID': product.product_id,
    'Product Name': product.product_name,
    'Current Stock': product.stock,
    'Minimum Stock': product.min_stock,
    'Stock Status': product.stock <= product.min_stock ? 'Low Stock' : 'In Stock',
    'Stock Deficit': product.stock <= product.min_stock ? product.min_stock - product.stock : 0,
    'Stock Value': formatIndianRupee(product.stock * product.default_price),
    'Unit Price': formatIndianRupee(product.default_price),
    'Categories': product.categories?.map((cat: any) => cat.name).join(', ') || 'N/A',
    'Stock Level': product.stock <= product.min_stock ? 'Critical' : 
                   product.stock <= product.min_stock * 1.5 ? 'Low' : 'Normal'
  }));
};