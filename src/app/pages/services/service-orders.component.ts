import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceOrdersService } from '../../services/service-orders.service';

@Component({
  selector: 'app-service-orders',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2>Service Orders</h2>
    <div class="card">
      <div class="grid two">
        <input class="input" placeholder="Related Sale ID (optional)" [(ngModel)]="saleId" />
        <input class="input" placeholder="Product ID" [(ngModel)]="productId" />
      </div>
      <textarea class="input" placeholder="Issue" [(ngModel)]="issue"></textarea>
      <input class="input" type="number" placeholder="Charges" [(ngModel)]="charges" />
      <button class="btn" (click)="create()">Create Service Order</button>
    </div>
  `
})
export class ServiceOrdersComponent {
  private svc = inject(ServiceOrdersService);
  saleId=''; productId=''; issue=''; charges:any = 0;
  async create(){
    const id = await this.svc.createServiceOrder({ saleId: this.saleId||null, productId: this.productId, issue: this.issue, charges: +this.charges });
    this.saleId=''; this.productId=''; this.issue=''; this.charges=0;
    alert('Service order: '+id);
  }
}
