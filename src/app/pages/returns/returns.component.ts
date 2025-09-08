import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReturnsService } from '../../services/returns.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [FormsModule, NgFor],
  template: `
    <h2>Sales Return</h2>
    <div class="card">
      <input class="input" placeholder="Sale ID" [(ngModel)]="saleId" />
      <div *ngFor="let it of items; let i=index" class="grid three" style="align-items:end">
        <input class="input" placeholder="Product ID" [(ngModel)]="it.productId" />
        <input class="input" type="number" placeholder="Qty" [(ngModel)]="it.qty" />
        <input class="input" type="number" placeholder="Sell Price" [(ngModel)]="it.sellPrice" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button class="btn secondary" (click)="add()">Add line</button>
        <button class="btn" (click)="submit()">Submit Return</button>
      </div>
    </div>
  `
})
export class ReturnsComponent {
  private svc = inject(ReturnsService);
  saleId = ''; items:any[] = [{ productId:'', qty:1, sellPrice:0 }];
  add(){ this.items.push({ productId:'', qty:1, sellPrice:0 }); }
  async submit(){
    await this.svc.createSalesReturn({ saleId: this.saleId, items: this.items.map(x=>({ ...x, qty:+x.qty, sellPrice:+x.sellPrice })) });
    this.saleId=''; this.items=[{ productId:'', qty:1, sellPrice:0 }];
    alert('Return created');
  }
}
 
