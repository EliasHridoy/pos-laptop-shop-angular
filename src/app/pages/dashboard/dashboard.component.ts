import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Dashboard</h1>
    <div class="grid three">
      <a class="card" routerLink="/catalog/products"><b>Products</b><div class="muted">Add/search laptops & parts</div></a>
      <a class="card" routerLink="/sales/new"><b>New Sale</b><div class="muted">Direct & instant sale</div></a>
      <a class="card" routerLink="/sales"><b>Sales</b><div class="muted">Invoices & history</div></a>
      <a class="card" routerLink="/returns"><b>Returns</b><div class="muted">Sales return</div></a>
      <a class="card" routerLink="/services"><b>Service Orders</b><div class="muted">Repair/service invoices</div></a>
      <a class="card" routerLink="/reports/profit"><b>Profit/Loss</b><div class="muted">By date range</div></a>
    </div>
  `,
  styles: [`.muted{color:#6b7280;font-size:12px}`]
})
export class DashboardComponent {

  async ngOnInit() {
    console.log("Dashboard initialized");
  }
}
 
