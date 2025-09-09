import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { SalesService } from '../../services/sales.service';
import { Router } from '@angular/router';
import { DecimalPipe, NgFor } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sales-new',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgFor],
  template: `
    <h2>New Sale</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <label><input type="radio" name="mode" value="DIRECT" [(ngModel)]="mode"> Direct</label>
        <label><input type="radio" name="mode" value="INSTANT" [(ngModel)]="mode"> Instant</label>
      </div>

      <div class="grid two">
        <div>
          <h3>Customer</h3>
          <div class="grid two">
            <input class="input" placeholder="Name" [(ngModel)]="customer.name"  required/>
            <input class="input" placeholder="Phone" [(ngModel)]="customer.phone" />
          </div>
          <input class="input" type="email" placeholder="Email (optional)" [(ngModel)]="customer.email" />
          <input class="input" placeholder="Address (optional)" [(ngModel)]="customer.address" />
        </div>
        <div>
          <h3>Search Product</h3>
          <input class="input" placeholder="Type name and Enter" [(ngModel)]="q" (keyup.enter)="search()" />
          <button class="btn secondary" (click)="search()">Search</button>
          <ul>
            <li *ngFor="let r of results" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee">
              <div><b>{{r.name}}</b> <span class="muted"> - Stock {{r.stockQty}}</span></div>
              <button class="btn secondary" (click)="add(r)">Add</button>
            </li>
          </ul>
        </div>
      </div>

      <h3>Cart</h3>
      <table class="table">
        <thead><tr><th>Item</th><th>Qty</th><th>Sell Price</th><th>Line</th><th>Action</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of cart; let i = index">
            <td>{{c.name}}</td>
            <td><input class="input" type="number" [(ngModel)]="c.qty" /></td>
            <td><input class="input" type="number" [(ngModel)]="c.sellPrice" /></td>
            <td>৳{{(c.qty||0) * (c.sellPrice||0) | number:'1.2-2'}}</td>
            <td><button class="btn secondary" (click)="removeFromCart(i)">Delete</button></td>
          </tr>
        </tbody>
      </table>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <div class="badge">Total: ৳{{ total() | number:'1.2-2' }}</div>
        <div style="display:flex; gap:8px;">
          <button class="btn secondary" (click)="cart=[]">Clear</button>
          <button class="btn" (click)="checkout()">Checkout</button>
        </div>
      </div>
    </div>
  `
})
export class SalesNewComponent {
  private products = inject(ProductsService);
  private sales = inject(SalesService);
  private router = inject(Router);
  private auth = inject(AuthService);

  mode: 'DIRECT' | 'INSTANT' = 'DIRECT';
  customer: any = { name: '', phone: '', email: '', address: '' };
  q = ''; results: any[] = []; cart: any[] = [];
  currentUser$ = this.auth.user$;

  async search() {
    const nameHits = await this.products.searchByName(this.q);
    const kwHits = this.q ? await this.products.searchByKeyword(this.q) : [];
    const map = new Map<string, any>();[...nameHits, ...kwHits].forEach(x => map.set(x.id, x));
    this.results = Array.from(map.values());
  }
  add(p: any) {
    const ex = this.cart.find((x: any) => x.id === p.id);
    if (ex) ex.qty += 1;
    else this.cart.push({ id: p.id, name: p.name, qty: 1, sellPrice: p.defaultSellPrice });
  }
  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  total() { return this.cart.reduce((s, c) => s + (Number(c.qty || 0) * Number(c.sellPrice || 0)), 0); }

  async checkout() {
    if (!this.cart.length) return;
    
    const currentUser = await new Promise<any>(resolve => {
      const subscription = this.auth.user$.subscribe(user => {
        resolve(user);
        subscription.unsubscribe();
      });
    });

    const items = this.cart.map(c => ({ productId: c.id, qty: +c.qty, sellPrice: +c.sellPrice }));
    const saleId = await this.sales.createSale({ 
      customer: this.customer, 
      items, 
      type: this.mode,
      soldBy: currentUser ? {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email
      } : undefined
    });
    this.router.navigate(['/sales/invoice', saleId]);
  }
}

