import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    <label class="file-picker" [class.dragover]="isDragOver" (dragover)="$event.preventDefault(); onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
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
    .file-btn { background:#10b981; color:#fff; padding:.55rem .9rem; border-radius:8px; font-weight:700; font-size:.8rem; border:none; box-shadow:0 1px 0 rgba(0,0,0,.04); }
  .file-picker[disabled] .file-btn, .file-picker input[disabled] + .file-btn { opacity:.5; cursor:not-allowed; }
  .file-picker.dragover { background: linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03)); border-radius:8px; padding:.5rem .6rem; }
  .file-picker.dragover .file-btn { background:#0ea5e9; }
    .file-name { font-size:.85rem; color:#334155; max-width:60%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  `]
})
export class ExcelUploadComponent {
  private excel = inject(UploadExcelService);
  private productsService = inject(ProductsService);
  private salesService = inject(SalesService);
  private notification = inject(NotificationService);
  fileName = '';
  isDragOver = false;

  allStockInRows: StockInModel[] = [];
  currentBatch: StockInModel[] = [];
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
      this.fileName = file.name;
      const data = await this.excel.readFileToJson(file);
      if (data.length > 0) {
        const firstSheet = data[0];
        this.allStockInRows = this.transformToStockIn(firstSheet.rows);
        this.totalRows = this.allStockInRows.length;
        this.loadCurrentBatch();
        this.notification.success('File loaded. Review the batch before saving.');
      } else {
        this.notification.error('No data found in the selected file.');
      }
    } catch (err: any) {
      console.error('Failed to read file', err);
      this.notification.error(err?.message || 'Failed to read file');
    }
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
      const createdIds = (await this.productsService.addProductsBatch(this.currentBatch)) as string[];

      // For any row that was imported with Status = Sold, create a sale record
      // We treat these as DIRECT sales because the products were just created in products collection
      const soldRows = this.currentBatch
        .map((row, index) => ({ row, id: createdIds[index] }))
        .filter(x => x.row.Status === ProductStatus.Sold && x.id);

      for (const s of soldRows) {
        try {
          // build custom invoiceNo if both SockOutDate and SaleInvoiceNo are present
          let invoiceNo: string | undefined = undefined;
          if (s.row.SockOutDate && s.row.SaleInvoiceNo) {
            // Normalize SockOutDate to YYYYMMDD if possible (handle YYYY-MM-DD or YYYY/MM/DD)
            const d = String(s.row.SockOutDate).replace(/\//g, '-');
            const parts = d.split('-').map(p => p.padStart(2, '0'));
            if (parts.length >= 3) {
              const y = parts[0];
              const m = parts[1];
              const day = parts[2];
              invoiceNo = `INV-${y}${m}${day}-${String(s.row.SaleInvoiceNo).padStart(4, '0')}`;
            }
          }

          await this.salesService.createSale({
            customer: null,
            items: [{
              productId: s.id,
              name: s.row.Item || '',
              qty: 1,
              sellPrice: Number(s.row.AskingPrice || 0),
              costPrice: Number(s.row.CostPrice || 0),
              description: s.row.Description || ''
            }],
            type: 'DIRECT',
            note: `Imported from Excel row No ${s.row.No || ''}`,
            paid: Number(s.row.AskingPrice || 0),
            soldBy: undefined,
            invoiceNo
          });
        } catch (err) {
          console.error('Failed to create sale for imported sold row', s, err);
        }
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

  private transformToStockIn(data: ExcelData[]): StockInModel[] {
    return data.map(excelRow => {
      const description = [
        excelRow.Item, excelRow.Brand, excelRow.Series, excelRow.Model, excelRow.Processor,
        excelRow.Genaration, `RAM: ${excelRow.RAM}`, `ROM: ${excelRow.ROM}`
      ].filter(Boolean).join(', ');

      return {
        No: excelRow.No ? parseInt(excelRow.No, 10) : undefined,
        Date: excelRow.Date,
        Item: excelRow.Item,
        Brand: excelRow.Brand,
        Series: excelRow.Series,
        Model: excelRow.Model,
        Processor: excelRow.Processor,
        Genaration: excelRow.Genaration,
        RAM: excelRow.RAM,
        ROM: excelRow.ROM,
        ProductID: excelRow.ProductID,
        CostPrice: excelRow.CostPrice ? parseFloat(excelRow.CostPrice.replace(/,/g, '')) : undefined,
        AskingPrice: excelRow.AskingPrice ? parseFloat(excelRow.AskingPrice.replace(/,/g, '')) : undefined,
        SockOutDate: excelRow.SockOutDate,
        SaleInvoiceNo: excelRow.SaleInvoiceNo,
        Description: description,
        Status: this.mapStatus(excelRow.Status),
      };
    });
  }

  private mapStatus(status?: string): ProductStatus {
    if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
      return status as ProductStatus;
    }
    return ProductStatus.Available;
  }
}
