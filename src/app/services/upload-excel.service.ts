import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface SheetJson<T = any> {
  sheetName: string;
  rows: T[];            // header-based JSON records
  rawRows?: any[][];    // optional: raw rows if needed
}

@Injectable({ providedIn: 'root' })
export class UploadExcelService {
  // Toggle: store dates as Date objects or as formatted strings
  private readonly returnDateAsDateObject = true;

  async readFileToJson(file: File): Promise<SheetJson[]> {
    // Basic validation
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      throw new Error('Only .xlsx or .xls files are supported.');
    }

    const arrayBuffer = await file.arrayBuffer();

    // Parse workbook (browser-safe)
    const wb: XLSX.WorkBook = XLSX.read(new Uint8Array(arrayBuffer), {
      type: 'array',
      cellDates: false,     // we will parse dates ourselves from strings
      raw: false,           // let SheetJS produce strings for us
    });

    const results: SheetJson[] = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];

      // Get header row to derive field names
      const header = this.getHeader(ws);

      // Convert to objects using headers
      const rows = XLSX.utils.sheet_to_json<any>(ws, {
        header,              // use the header array as keys
        range: 1,            // start after header row
        defval: null,        // keep empty cells explicit
        blankrows: false,
        raw: false
      });

      // Normalize/clean each record including dd/MM/yyyy -> Date/String
      const normalized = rows.map(r => this.normalizeRecord(r));

      results.push({
        sheetName,
        rows: normalized
      });
    }

    return results;
  }

  // Extract the first-row headers; fall back to A, B, C if blank
  private getHeader(ws: XLSX.WorkSheet): string[] {
    const headerRow = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, range: 0, raw: false }) || [];
    const header = (headerRow as any[]).map((h, i) => this.slugKey(h ?? `Column${i + 1}`));
    // Ensure unique keys
    const seen = new Set<string>();
    return header.map((k, i) => {
      let key = k || `col_${i+1}`;
      while (seen.has(key)) key = `${key}_${i}`;
      seen.add(key);
      return key;
    });
  }

  // Convert arbitrary header to safe object key
  private slugKey(h: any): string {
    return String(h ?? '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '')
      || '';
  }

  // Parse dd/MM/yyyy strictly; return Date or original string if invalid
  private parseDdMMyyyy(value: any): Date | string | null {
    if (value == null) return null;
    if (value instanceof Date) return value; // already a Date
    const s = String(value).trim();
    // Accept 01/02/2025 or 1/2/2025
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (!m) return value;
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const date = new Date(y, mo, d);
    // Validate constructed date
    if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return value;
    return this.returnDateAsDateObject ? date : date.toISOString().slice(0, 10);
  }

  // Adjust field names for known columns and coerce data types
  private normalizeRecord(record: any): any {
    if (!record || typeof record !== 'object') return record;

    const normalized: any = {};
    for (const [key, rawVal] of Object.entries(record)) {
      let val: any = rawVal;

      // Heuristics: If header includes 'date', parse dd/MM/yyyy
      if (/\bdate\b/i.test(key)) {
        val = this.parseDdMMyyyy(val);
      }

      // Coerce numeric-like fields
      if (this.looksLikeMoneyKey(key)) {
        val = this.toNumberOrNull(val);
      }

      // Keep as-is otherwise
      normalized[key] = val;
    }

    return normalized;
  }

  private looksLikeMoneyKey(k: string): boolean {
    return /\b(price|cost|revenue|amount|debit|credit|balance)\b/i.test(k);
  }

  private toNumberOrNull(v: any): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
    }
}
