import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadExcelService, SheetJson } from '../../services/upload-excel.service';
import { ExcelData } from '../../models/excel-data.model';
import { StockInModel } from '../../models/stock-in.model';
import { ProductStatus } from '../../models/product-status.enum';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <input type="file" accept=".xlsx,.xls" (change)="onFile($event)" [disabled]="allStockInRows.length > 0" />

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
    :host {
      display: block;
      max-width: 100%;
    }
    .excel-preview { margin: 1rem 0; }
    .table-responsive {
      width: 100%;
      overflow: auto; /* Enables both vertical and horizontal scrolling */
      max-height: 70vh; /* Limit height to 70% of the viewport height */
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .batch-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .form-control { width: 100%; padding: 0.375rem 0.75rem; box-sizing: border-box; }
    .table { table-layout: auto; white-space: nowrap; }
    .table th, .table td { min-width: 180px; vertical-align: middle; }
    .table th {
      position: sticky;
      top: 0;
      background: #f8f9fa; /* Light background to cover content during scroll */
      z-index: 1;
    }
  `]
})
export class ExcelUploadComponent {
  private excel = inject(UploadExcelService);
  private productsService = inject(ProductsService);

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

    const data = await this.excel.readFileToJson(file);
    if (data.length > 0) {
      const firstSheet = data[0];
      this.allStockInRows = this.transformToStockIn(firstSheet.rows);
      this.totalRows = this.allStockInRows.length;
      this.loadCurrentBatch();
    }
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
      await this.productsService.addProductsBatch(this.currentBatch);
      this.currentPage++;
      if (this.currentPage * this.batchSize >= this.totalRows) {
        alert('All data has been saved successfully!');
        this.reset();
      } else {
        this.loadCurrentBatch();
      }
    } catch (error) {
      console.error('Failed to save batch:', error);
      alert('There was an error saving the data. Please check the console and try again.');
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
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    if (input) input.value = '';
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
