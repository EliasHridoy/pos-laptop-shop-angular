import { Component } from '@angular/core';
import { NgFor, DecimalPipe, NgIf } from '@angular/common';
import { DateRangeComponent } from '../../components/date-range.component';
import { ReportsService } from '../../services/reports.service';

@Component({
  selector: 'app-purchase-report',
  standalone: true,
  imports: [DateRangeComponent, NgFor, NgIf, DecimalPipe],
  template: `
    <h2>Purchase Report</h2>
    <app-date-range (changed)="load($event)"></app-date-range>
    <div class="card" *ngIf="rows.length">
      <table class="table">
        <thead><tr><th>ID</th><th>Supplier</th><th>Total</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td>{{r.id}}</td><td>{{r.supplierName || '-'}}</td><td>৳{{r.total | number:'1.2-2'}}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:8px; font-weight:bold;">Total Purchases: ৳{{total | number:'1.2-2'}}</div>
    </div>
  `
})
export class PurchaseReportComponent {
  constructor(private reports: ReportsService) {}
  rows:any[] = []; total=0;
  async load(r:{from:string,to:string}){
    const data = await this.reports.purchasesBetween(r.from, r.to);
    this.rows = data; this.total = data.reduce((s,x)=>s+(x.total||0),0);
  }
}
 
