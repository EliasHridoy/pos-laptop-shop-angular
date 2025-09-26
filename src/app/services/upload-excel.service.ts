import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ExcelData } from '../models/excel-data.model';

export interface SheetJson<T = any> {
  sheetName: string;
  rows: T[];            // header-based JSON records
  rawRows?: any[][];    // optional: raw rows if needed
}

@Injectable({ providedIn: 'root' })
export class UploadExcelService {

  async readFileToJson(file: File): Promise<SheetJson<ExcelData>[]> {
    // Basic validation
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      throw new Error('Only .xlsx or .xls files are supported.');
    }

    const arrayBuffer = await file.arrayBuffer();

    // Parse workbook (browser-safe)
    const wb: XLSX.WorkBook = XLSX.read(new Uint8Array(arrayBuffer), {
      type: 'array',
      cellDates: true, // To properly handle dates from Excel
    });

    const results: SheetJson<ExcelData>[] = [];
    const propertyNames: (keyof ExcelData)[] = [
      'No', 'Date', 'Item', 'Brand', 'Series', 'Model', 'Processor', 'Genaration',
      'RAM', 'ROM', 'ProductID', 'CostPrice', 'AskingPrice', 'Revenue', 'NetRevenue',
      'SockOutDate', 'SaleInvoiceNo', 'Status', 'FeedBack'
    ];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      
      // Convert to array of arrays.
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        blankrows: false,
        defval: '', // Use empty string for blank cells
      });

      // Skip header row (the first row) and map to ExcelData objects
      const mappedRows: ExcelData[] = rawRows.slice(1).map(rowArray => {
        const rowObject: ExcelData = {};
        propertyNames.forEach((propName, index) => {
          const value = rowArray[index];
          if (value instanceof Date) {
            // Handle dates - format as YYYY-MM-DD string
            (rowObject as any)[propName] = value.toISOString().split('T')[0];
          } else {
            (rowObject as any)[propName] = value !== null && value !== undefined ? String(value) : undefined;
          }
        });
        return rowObject;
      });

      results.push({
        sheetName,
        rows: mappedRows,
      });
    }

    return results;
  }
}