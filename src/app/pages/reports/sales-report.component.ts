import { Component } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { DateRangeComponent } from '../../components/date-range.component';
import { ReportsService } from '../../services/reports.service';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [DateRangeComponent, NgFor, NgIf, DecimalPipe],
  template: `
    <h2>Sales Report</h2>
    <app-date-range (changed)="load($event)"></app-date-range>
    <div class="card" *ngIf="rows.length">
      <table class="table">
        <thead><tr><th>Invoice</th><th>Type</th><th>Total</th><th>Profit</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td>{{r.invoiceNo}}</td><td>{{r.type}}</td><td>৳{{r.total | number:'1.2-2'}}</td><td>৳{{r.profit | number:'1.2-2'}}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:8px; font-weight:bold;">Grand Total: ৳{{total | number:'1.2-2'}} · Profit: ৳{{profit | number:'1.2-2'}}</div>
    </div>
  `
})
export class SalesReportComponent {
  constructor(private reports: ReportsService) {}
  rows:any[] = []; total=0; profit=0;
  async load(r:{from:string,to:string}){
    const data = await this.reports.salesBetween(r.from, r.to);
    this.rows = data; this.total = data.reduce((s,x)=>s+x.total,0); this.profit = data.reduce((s,x)=>s+x.profit,0);
  }
}
 
