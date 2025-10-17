import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { UploadExcelService, SheetJson } from '../../services/upload-excel.service';
import { ExcelData } from '../../models/excel-data.model';
import { StockInModel } from '../../models/stock-in.model';
import { ProductStatus } from '../../models/product-status.enum';
import { ProductsService } from '../../services/products.service';
import { SalesService } from '../../services/sales.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="file-row">
      <label class="file-picker" [class.dragover]="isDragOver" [class.disabled]="allStockInRows.length > 0" (dragover)="$event.preventDefault(); onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
      <input #fileInput type="file" accept=".xlsx,.xls" (change)="onFile($event)" [disabled]="allStockInRows.length > 0" />
      <span class="file-btn" aria-hidden="true">
        <!-- simple upload SVG icon -->
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle; margin-right:6px;">
          <path d="M12 3v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M8 7l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M21 21H3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        Choose Excel file
      </span>
      <span class="file-name" *ngIf="fileName">{{ fileName }}</span>
      </label>

      <!-- Sample file download -->
      <a class="sample-btn" href="assets/Laptop%20Core%20Technology%20sample%20data.xlsx" download="Laptop Core Technology sample data.xlsx" title="Download sample Excel">Download sample Excel</a>
    </div>

    <div *ngIf="currentBatch.length > 0" class="excel-preview">
      <h4>Review and Edit Data</h4>
      <div class="batch-info">
        <p>Showing rows {{ (currentPage * batchSize) + 1 }} - {{ (currentPage * batchSize) + currentBatch.length }} of {{ totalRows }}</p>
        <button (click)="saveAndNext()" [disabled]="isSaving">{{ isSaving ? 'Saving...' : 'Save and Load Next' }}</button>
      </div>

      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>Item</th>
              <th>Brand</th>
              <th>Series</th>
              <th>Model</th>
              <th>Processor</th>
              <th>Genaration</th>
              <th>RAM</th>
              <th>ROM</th>
              <th>Product ID</th>
              <th>Cost Price</th>
              <th>Description</th>
              <th>Status</th>
              <th>Asking Price</th>
              <th>Revenue</th>
              <th>Net Revenue</th>
              <th>Stock Out Date</th>
              <th>Sale Invoice No</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of currentBatch; let i = index">
              <td><input type="number" [(ngModel)]="row.No" class="form-control" /></td>
              <td><input [(ngModel)]="row.Date" class="form-control" /></td>
              <td><input [(ngModel)]="row.Item" class="form-control" /></td>
              <td><input [(ngModel)]="row.Brand" class="form-control" /></td>
              <td><input [(ngModel)]="row.Series" class="form-control" /></td>
              <td><input [(ngModel)]="row.Model" class="form-control" /></td>
              <td><input [(ngModel)]="row.Processor" class="form-control" /></td>
              <td><input [(ngModel)]="row.Genaration" class="form-control" /></td>
              <td><input [(ngModel)]="row.RAM" class="form-control" /></td>
              <td><input [(ngModel)]="row.ROM" class="form-control" /></td>
              <td><input [(ngModel)]="row.ProductID" class="form-control" /></td>
              <td><input type="number" [(ngModel)]="row.CostPrice" class="form-control" /></td>
              <td><input [(ngModel)]="row.Description" class="form-control" /></td>
              <td>
                <select [(ngModel)]="row.Status" class="form-control">
                  <option *ngFor="let status of productStatusValues" [value]="status">{{ status }}</option>
                </select>
              </td>
              <td><input type="number" [(ngModel)]="row.AskingPrice" class="form-control" /></td>
              <td><input type="number" [(ngModel)]="row.Revenue" class="form-control" /></td>
              <td><input type="number" [(ngModel)]="row.NetRevenue" class="form-control" /></td>
              <td><input [(ngModel)]="row.StockOutDate" class="form-control" /></td>
              <td><input [(ngModel)]="row.SaleInvoiceNo" class="form-control" /></td>
              <td><input [(ngModel)]="row.FeedBack" class="form-control" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; max-width:100%; }
    input[type=file] { margin:.5rem 0 1rem; }
    .excel-preview { margin: 1rem 0 2rem; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:1rem 1.25rem 1.25rem; box-shadow:0 1px 2px rgba(0,0,0,0.04); }
    .excel-preview h4 { margin:0 0 1rem; font-size:1.1rem; font-weight:600; color:#1f2937; }
    .batch-info { display:flex; justify-content:space-between; align-items:center; background:#f1f5f9; border:1px solid #e2e8f0; padding:.65rem .9rem; border-radius:8px; margin-bottom:1rem; font-size:.8rem; }
    .batch-info p { margin:0; font-weight:500; color:#334155; }
    .batch-info button { background:#2563eb; color:#fff; border:none; padding:.55rem .9rem; font-size:.7rem; font-weight:600; border-radius:6px; cursor:pointer; letter-spacing:.5px; text-transform:uppercase; }
    .batch-info button[disabled] { opacity:.5; cursor:not-allowed; }
    .batch-info button:not([disabled]):hover { background:#1d4ed8; }

    .table-responsive { width:100%; overflow:auto; max-height:70vh; border:1px solid #e2e8f0; border-radius:10px; box-sizing:border-box; background:#fff; }
    .table { width:100%; border-collapse:separate; border-spacing:0; table-layout:auto; white-space:nowrap; font-size:.72rem; }
    .table thead th { position:sticky; top:0; background:linear-gradient(#f8fafc,#f1f5f9); z-index:5; box-shadow:0 2px 0 #e2e8f0; text-transform:uppercase; font-size:.6rem; letter-spacing:.06em; font-weight:600; padding:.55rem .65rem; color:#334155; border-bottom:1px solid #e2e8f0; }
    .table tbody td { background:#fff; border-bottom:1px solid #f1f5f9; padding:.4rem .5rem; vertical-align:middle; }
    .table tbody tr:nth-child(even) td { background:#f8fafc; }
    .table tbody tr:hover td { background:#eef2ff; }
    .table th, .table td { min-width:160px; }

    .form-control { width:100%; padding:.35rem .55rem; box-sizing:border-box; border:1px solid #cbd5e1; background:#ffffff; font-size:.65rem; border-radius:6px; transition:border-color .15s, box-shadow .15s; }
    .form-control:focus { outline:none; border-color:#6366f1; box-shadow:0 0 0 1px #6366f1, 0 0 0 3px rgba(99,102,241,.25); }
    .form-control[disabled] { background:#f1f5f9; cursor:not-allowed; }
    select.form-control { padding:.35rem .4rem; }

    /* Narrow columns for numbers */
    td:first-child input { text-align:center; }
    td:nth-child(12) input { text-align:right; }

    /* Scrollbar styling (WebKit) */
    .table-responsive::-webkit-scrollbar { height:10px; width:10px; }
    .table-responsive::-webkit-scrollbar-track { background:#f1f5f9; }
    .table-responsive::-webkit-scrollbar-thumb { background:#94a3b8; border-radius:10px; }
    .table-responsive::-webkit-scrollbar-thumb:hover { background:#64748b; }

    @media (max-width: 1200px) {
      .table th, .table td { min-width:140px; }
    }
    @media (max-width: 900px) {
      .table th:nth-child(2), .table td:nth-child(2), /* Date */
      .table th:nth-child(5), .table td:nth-child(5), /* Series */
      .table th:nth-child(7), .table td:nth-child(7), /* Processor */
      .table th:nth-child(8), .table td:nth-child(8) /* Generation */ { display:none; }
    }
    /* File picker styles */
    .file-picker { display:flex; align-items:center; gap:.75rem; cursor:pointer; }
    .file-picker input[type=file] { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
    .file-btn { background:#10b981; color:#fff; padding:.55rem .9rem; border-radius:8px; font-weight:700; font-size:.8rem; border:none; box-shadow:0 1px 0 rgba(0,0,0,.04); display:inline-flex; align-items:center; }
    .file-btn:focus { outline: 2px solid rgba(99,102,241,.15); box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
  .file-picker[disabled] .file-btn, .file-picker input[disabled] + .file-btn, .file-picker.disabled { opacity:.5; cursor:not-allowed; }
  .file-picker.dragover { background: linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03)); border-radius:8px; padding:.5rem .6rem; }
  .file-picker.dragover .file-btn { background:#0ea5e9; }
    .file-name { font-size:.85rem; color:#334155; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .file-row { display:flex; gap:1rem; align-items:center; margin-bottom:.75rem; }
  .sample-btn { display:inline-block; background:#f3f4f6; color:#374151; padding:.5rem .8rem; border-radius:8px; text-decoration:none; font-weight:600; border:1px solid #e5e7eb; }
  .sample-btn:hover { background:#e6eefb; color:#1e3a8a; }
  `]
})
export class ExcelUploadComponent {
  private excel = inject(UploadExcelService);
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);
  private notification = inject(NotificationService);
  fileName = '';
  isDragOver = false;
  // maximum file size allowed (bytes)
  readonly maxFileSize = 10 * 1024 * 1024; // 10 MB

  allStockInRows: ExcelData[] = [];
  currentBatch: ExcelData[] = [];
  currentPage = 0;
  batchSize = 100;
  totalRows = 0;
  isSaving = false;

  productStatusValues = Object.values(ProductStatus);

  async onFile(evt: Event) {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.item(0);
    if (!file) return;
    await this.handleFile(file);
  }

  async handleFile(file: File) {
    try {
      // Basic validations
      const name = file.name || '';
      const ext = name.split('.').pop()?.toLowerCase() || '';
      const allowed = ['xlsx', 'xls'];
      if (!allowed.includes(ext)) {
        this.clearFileInput();
        this.notification.error('Unsupported file type. Please upload an .xlsx or .xls file.');
        return;
      }

      if (file.size > this.maxFileSize) {
        const allowedMB = (this.maxFileSize / (1024 * 1024)).toFixed(0);
        this.clearFileInput();
        this.notification.error(`File is too large. Maximum allowed size is ${allowedMB} MB.`);
        return;
      }

      this.fileName = file.name;
      const data = await this.excel.readFileToJson(file);
      if (data.length > 0) {
        const firstSheet = data[0];
        this.allStockInRows = this.transformToExcelData(firstSheet.rows);
        this.totalRows = this.allStockInRows.length;
        this.loadCurrentBatch();
        this.notification.success('File loaded. Review the batch before saving.');
      } else {
        this.clearFileInput();
        this.notification.error('No data found in the selected file.');
      }
    } catch (err: any) {
      console.error('Failed to read file', err);
      this.clearFileInput();
      this.notification.error(err?.message || 'Failed to read file');
    }
  }

  private clearFileInput() {
    const input = document.querySelector('input[type=file]') as HTMLInputElement | null;
    if (input) input.value = '';
    this.fileName = '';
  }

  onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragOver = false;
  }

  async onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDragOver = false;
    const file = evt.dataTransfer?.files?.[0];
    if (!file) return;
    await this.handleFile(file);
  }

  loadCurrentBatch() {
    const start = this.currentPage * this.batchSize;
    const end = start + this.batchSize;
    this.currentBatch = this.allStockInRows.slice(start, end);
  }

  async saveAndNext() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const stockInData = this.transformToStockIn(this.currentBatch);
      const createdIds = (await this.productsService.addProductsBatch(stockInData)) as string[];

      // For any row that was imported with Status = Sold, create a sale record
      // We treat these as DIRECT sales because the products were just created in products collection
      const soldRows = this.currentBatch
        .map((row, index) => ({ row, id: createdIds[index] }))
        .filter(x => x.row.Status === ProductStatus.Sold && x.id);

      const salePayloads = soldRows.map(s => {
        // build custom invoiceNo if both StockOutDate and SaleInvoiceNo are present
        let invoiceNo: string | undefined = undefined;
        if (s.row.StockOutDate && s.row.SaleInvoiceNo) {
          // Normalize StockOutDate to YYYYMMDD if possible (handle YYYY-MM-DD or YYYY/MM/DD)
          const d = String(s.row.StockOutDate).replace(/\//g, '-');
          const parts = d.split('-').map(p => p.padStart(2, '0'));
          if (parts.length >= 3) {
            const y = parts[0];
            const m = parts[1];
            const day = parts[2];
            invoiceNo = `INV-${y}${m}${day}-${String(s.row.SaleInvoiceNo).padStart(4, '0')}`;
          }
        }

        return {
          customer: null,
          items: [{
            productId: s.id,
            productSerialNumber: s.row.ProductID,
            name: s.row.Item || '',
            qty: 1,
            sellPrice: Number(s.row.Revenue || 0),
            costPrice: Number(s.row.CostPrice || 0),
            description: s.row.Description || '',
            stockOutDate: this.convertToTimestamp(s.row.StockOutDate)
          }],
          type: 'DIRECT' as const,
          note: `Imported from Excel row No ${s.row.No || ''}`,
          paid: Number(s.row.Revenue || 0),
          soldBy: undefined,
          invoiceNo
        };
      });

      if (salePayloads.length > 0) {
        await this.salesService.createSalesBulk(salePayloads);
      }

      this.currentPage++;
      if (this.currentPage * this.batchSize >= this.totalRows) {
        this.notification.success('All data has been saved successfully!');
        this.reset();
      } else {
        this.loadCurrentBatch();
      }
    } catch (error) {
      console.error('Failed to save batch:', error);
      this.notification.error('There was an error saving the data. Please check the console and try again.');
    } finally {
      this.isSaving = false;
    }
  }

  reset() {
    this.allStockInRows = [];
    this.currentBatch = [];
    this.currentPage = 0;
    this.totalRows = 0;
    // Reset file input
    const input = document.querySelector('input[type=file]') as HTMLInputElement | null;
    if (input) input.value = '';
    this.fileName = '';
  }

  private transformToExcelData(data: ExcelData[]): ExcelData[] {
    return data.map(excelRow => ({
      ...excelRow,
      Description: [
        excelRow.Item, excelRow.Brand, excelRow.Series, excelRow.Model, excelRow.Processor,
        excelRow.Genaration, `RAM: ${excelRow.RAM}`, `ROM: ${excelRow.ROM}`
      ].filter(Boolean).join(', ')
    }));
  }

  private transformToStockIn(data: ExcelData[]): StockInModel[] {
    return data.map(excelRow => ({
      No: excelRow.No ? parseInt(excelRow.No, 10) : undefined,
      Date: this.convertToTimestamp(excelRow.Date),
      Item: excelRow.Item,
      Brand: excelRow.Brand,
      Series: excelRow.Series,
      Model: excelRow.Model,
      Processor: excelRow.Processor,
      Genaration: excelRow.Genaration,
      RAM: excelRow.RAM,
      ROM: excelRow.ROM,
      ProductID: excelRow.ProductID,
      CostPrice: this.parseNumericValue(excelRow.CostPrice),
      AskingPrice: this.parseNumericValue(excelRow.AskingPrice),
      Revenue: this.parseNumericValue(excelRow.Revenue),
      NetRevenue: this.parseNumericValue(excelRow.NetRevenue),
      StockOutDate: excelRow.StockOutDate ? this.convertToTimestamp(excelRow.StockOutDate) : undefined,
      SaleInvoiceNo: excelRow.SaleInvoiceNo,
      Description: excelRow.Description,
      Status: this.mapStatus(excelRow.Status),
      FeedBack: excelRow.FeedBack,
    }));
  }

  private convertToTimestamp(dateStr?: string): Timestamp {
    if (!dateStr) return Timestamp.now();
    // If it's already a Timestamp (from previous runs), return as-is
    if ((dateStr as any)?.toDate && typeof (dateStr as any).toDate === 'function') {
      return dateStr as unknown as Timestamp;
    }

    // If it's a number (Excel serial number), convert from days since 1899-12-30
    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const ms = (dateStr as number) * 24 * 60 * 60 * 1000;
      return Timestamp.fromDate(new Date(excelEpoch.getTime() + ms));
    }

    // Normalize string separators and try to parse
    const s = String(dateStr).trim();
    // If looks like YYYYMMDD (e.g., 20251017)
    if (/^\d{8}$/.test(s)) {
      const y = parseInt(s.slice(0, 4), 10);
      const m = parseInt(s.slice(4, 6), 10) - 1;
      const d = parseInt(s.slice(6, 8), 10);
      return Timestamp.fromDate(new Date(y, m, d));
    }

    // Replace slashes with dashes to help ISO parsing
    const normalized = s.replace(/\//g, '-');
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) {
      return Timestamp.fromDate(date);
    }

    // Fallback to current time
    return Timestamp.now();
  }

  private parseNumericValue(value: string | number | undefined): number | undefined {
    if (value == null || value === '') return undefined;
    const strValue = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? undefined : parsed;
  }

  private mapStatus(status?: string): ProductStatus {
    if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
      return status as ProductStatus;
    }
    return ProductStatus.Available;
  }
}
