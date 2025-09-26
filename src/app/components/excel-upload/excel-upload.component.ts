import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadExcelService, SheetJson } from '../../services/upload-excel.service';
import { ExcelData } from '../../models/excel-data.model';
import { StockInModel } from '../../models/stock-in.model';
import { ProductStatus } from '../../models/product-status.enum';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <input type="file" accept=".xlsx,.xls" (change)="onFile($event)" />

    <!-- Excel Preview Table -->
    <div *ngIf="previewData" class="excel-preview">
      <h4>Excel Preview (First 100 rows)</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th *ngFor="let header of previewData.headers">{{header}}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of previewData.rows">
              <td *ngFor="let header of previewData.headers">{{row[header]}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .excel-preview {
      margin: 1rem 0;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  `]
})
export class ExcelUploadComponent {
  private excel = inject(UploadExcelService);

  data: SheetJson<ExcelData>[] | null = null;
  previewData: { headers: (keyof ExcelData)[]; rows: ExcelData[] } | null = null;
  readonly stockHeaders: (keyof ExcelData)[] = [
    'No', 'Date', 'Item', 'Brand', 'Series', 'Model', 'Processor',
    'Genaration', 'RAM', 'ROM', 'ProductID', 'CostPrice', 'AskingPrice',
    'Revenue', 'NetRevenue', 'SockOutDate', 'SaleInvoiceNo', 'Status', 'FeedBack'
  ];

  async onFile(evt: Event) {
    const input = evt.target as HTMLInputElement | null;
    const file = input?.files?.item(0);
    if (!file) return;

    const data = await this.excel.readFileToJson(file);
    this.data = data;

    if (data.length > 0) {
      const firstSheet = data[0];
      const rows = firstSheet.rows;

      const stockInRows = this.transformToStockIn(rows);
      console.log('Mapped Stock Rows:', stockInRows);

      const previewRows = rows.slice(0, 100); // Take only first 100 rows for preview
      this.previewData = {
        headers: this.stockHeaders,
        rows: previewRows
      };
    }
  }

  private transformToStockIn(data: ExcelData[]): StockInModel[] {
    return data.map(excelRow => {
      const description = [
        excelRow.Item,
        excelRow.Brand,
        excelRow.Series,
        excelRow.Model,
        excelRow.Processor,
        excelRow.Genaration,
        `RAM: ${excelRow.RAM}`,
        `ROM: ${excelRow.ROM}`
      ].filter(Boolean).join(', ');

      const stockIn: StockInModel = {
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
      return stockIn;
    });
  }

  private mapStatus(status?: string): ProductStatus {
    if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
        return status as ProductStatus;
    }
    return ProductStatus.Available;
  }
}