import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchasesService } from '../../services/purchases.service';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [FormsModule, NgFor],
  template: `
    <h2>Purchases</h2>
    <div class="card">
      <div class="grid two">
        <input class="input" placeholder="Supplier Name" [(ngModel)]="supplierName" />
      </div>
      <div *ngFor="let it of items; let i = index" class="grid three" style="align-items:end">
        <input class="input" placeholder="Product ID" [(ngModel)]="it.productId" />
        <input class="input" type="number" placeholder="Qty" [(ngModel)]="it.qty" />
        <input class="input" type="number" placeholder="Cost Price" [(ngModel)]="it.costPrice" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button class="btn secondary" (click)="addLine()">Add Line</button>
        <button class="btn" (click)="submit()">Save Purchase</button>
      </div>
    </div>
  `
})
export class PurchasesComponent {
  private svc = inject(PurchasesService);
  supplierName = '';
  items:any[] = [{ productId:'', qty:1, costPrice:0 }];
  addLine(){ this.items.push({ productId:'', qty:1, costPrice:0 }); }
  async submit(){
    await this.svc.createPurchase({ supplierName: this.supplierName, items: this.items.map(x=>({ productId:x.productId, qty:+x.qty, costPrice:+x.costPrice })) });
    this.supplierName=''; this.items=[{ productId:'', qty:1, costPrice:0 }];
    alert('Purchase saved');
  }
}
 
