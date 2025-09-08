import { Component } from '@angular/core';
import { DateRangeComponent } from '../../components/date-range.component';
import { ReportsService } from '../../services/reports.service';
import { DecimalPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-profit-loss-report',
  standalone: true,
  imports: [DateRangeComponent, DecimalPipe, NgIf],
  template: `
    <h2>Profit / Loss</h2>
    <app-date-range (changed)="load($event)"></app-date-range>
    <div class="grid two" *ngIf="result">
      <div class="card"><div class="muted">Revenue</div><div style="font-weight:bold;font-size:18px">৳{{result.revenue | number:'1.2-2'}}</div></div>
      <div class="card"><div class="muted">COGS</div><div style="font-weight:bold;font-size:18px">৳{{result.costFromSales | number:'1.2-2'}}</div></div>
      <div class="card"><div class="muted">Other Purchases</div><div style="font-weight:bold;font-size:18px">৳{{result.otherPurchases | number:'1.2-2'}}</div></div>
      <div class="card"><div class="muted">Gross Profit</div><div style="font-weight:bold;font-size:18px">৳{{result.grossProfit | number:'1.2-2'}}</div></div>
      <div class="card" style="grid-column:1/-1"><div class="muted">Net Profit</div><div style="font-weight:bold;font-size:22px">৳{{result.netProfit | number:'1.2-2'}}</div></div>
    </div>
  `
})
export class ProfitLossReportComponent {
  constructor(private reports: ReportsService) {}
  result:any=null;
  async load(r:{from:string,to:string}){
    const [sales, purchases] = await Promise.all([
      this.reports.salesBetween(r.from, r.to),
      this.reports.purchasesBetween(r.from, r.to)
    ]);
    const revenue = sales.reduce((s:any,x:any)=>s+x.total,0);
    const costFromSales = sales.reduce((s:any,x:any)=>s+x.costTotal,0);
    const otherPurchases = purchases.reduce((s:any,x:any)=>s+(x.total||0),0);
    const grossProfit = revenue - costFromSales;
    const netProfit = grossProfit - otherPurchases;
    this.result = { revenue, costFromSales, otherPurchases, grossProfit, netProfit };
  }
}
 
