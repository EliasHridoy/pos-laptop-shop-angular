import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { SalesService } from '../../services/sales.service';
import { Router } from '@angular/router';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sales-new',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgFor, NgIf],
  template: `
    <h2>New Sale</h2>
    <div class="card">
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <label><input type="radio" name="mode" value="DIRECT" [(ngModel)]="mode"> Direct</label>
        <label><input type="radio" name="mode" value="INSTANT" [(ngModel)]="mode"> Instant</label>
      </div>

      <div class="grid">
        <div>
          <h3>Customer</h3>
          <div class="grid two">
            <div>
              <input class="input" [class.error]="!customer.name?.trim()" placeholder="Name *" [(ngModel)]="customer.name" required/>
            </div>
            <div>
              <input class="input" [class.error]="!customer.phone?.trim()" placeholder="Phone *" [(ngModel)]="customer.phone" required/>
            </div>
          </div>
          <input class="input" type="email" placeholder="Email (optional)" [(ngModel)]="customer.email" />
          <input class="input" placeholder="Address (optional)" [(ngModel)]="customer.address" />
        </div>
        <div>
          <h3>Search Product</h3>
          <div style="margin-bottom: 8px;">
            <input class="input" placeholder="Type name and Enter" [(ngModel)]="q" (keyup.enter)="search()" />
            <button class="btn secondary" (click)="search()">Search</button>
          </div>
          <div style="height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px;">
              <div *ngFor="let r of results" class="card" style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div>
                  <b>{{r.name}}</b>
                  <div class="muted" style="font-size: 0.9em;">
                    {{r.Brand}} {{r.Series}} {{r.Model}}
                    <div>{{r.RAM}} {{r.ROM}}</div>
                    <div *ngIf="r.ProductID">ID: {{r.ProductID}}</div>
                  </div>
                </div>
                <button class="btn secondary" style="width: 100%;" (click)="add(r)">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Cart -->
      <div style="position: fixed; bottom: 20px; right: 20px; width: 400px; background: white; 
           box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; z-index: 1000; 
           transition: all 0.3s ease;" 
           [class.hidden]="!cart.length"
           [style.height]="isCartMinimized ? '50px' : 'auto'">
        
        <!-- Cart Header -->
        <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"
             (click)="isCartMinimized = !isCartMinimized">
          <h3 style="margin: 0;">Cart ({{cart.length}} items)</h3>
          <button class="btn secondary" style="padding: 2px 8px;">
            {{isCartMinimized ? '▲' : '▼'}}
          </button>
        </div>

        <!-- Cart Content - Only visible when not minimized -->
        <div [style.display]="isCartMinimized ? 'none' : 'block'">
          <div style="max-height: calc(70vh - 200px); overflow-y: auto;">
            <table class="table" style="margin: 0;">
              <thead style="position: sticky; top: 0; background: white; z-index: 1;">
                <tr>
                  <th>Item Details</th>
                  <th style="width: 80px;">Qty</th>
                  <th style="width: 100px;">Price</th>
                  <th style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of cart; let i = index">
                  <td>
                    <div><b>{{c.name}}</b></div>
                    <div class="muted" style="font-size: 0.9em;">
                      {{c.brand}} {{c.series}}
                      <div>ID: {{c.productId || 'N/A'}}</div>
                    </div>
                  </td>
                  <td><input class="input" type="number" [(ngModel)]="c.qty" min="1" style="width: 60px;" /></td>
                  <td><input class="input" type="number" [(ngModel)]="c.sellPrice" min="0" style="width: 80px;" /></td>
                  <td><button class="btn secondary" (click)="removeFromCart(i)" style="padding: 4px 8px;">×</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Cart Footer -->
          <div style="padding: 12px; border-top: 1px solid #eee; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div class="badge">Total: ৳{{ total() | number:'1.2-2' }}</div>
              <div>
                <input class="input" type="number" [(ngModel)]="paymentAmount" [max]="total()" 
                       style="width:120px" placeholder="Payment Amount *" required/>
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button class="btn secondary" (click)="cart=[]">Clear</button>
              <button class="btn" (click)="checkout()">Checkout</button>
            </div>
          </div>
        </div>
      </div>
      <div style="margin-top:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div class="badge">Total: ৳{{ total() | number:'1.2-2' }}</div>
          <div>
            <label>Payment Amount: </label>
            <input class="input" type="number" [(ngModel)]="paymentAmount" [max]="total()" style="width:150px" placeholder="Enter amount"/>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
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
  private notification = inject(NotificationService);

  mode: 'DIRECT' | 'INSTANT' = 'DIRECT';
  customer: any = { name: '', phone: '', email: '', address: '' };
  q = ''; results: any[] = []; cart: any[] = [];
  currentUser$ = this.auth.user$;
  paymentAmount: number = 0;
  isCartMinimized = false;

  async search() {
    const nameHits = await this.products.searchByName(this.q, true);
    const kwHits = this.q ? await this.products.searchByKeyword(this.q, true) : [];
    const map = new Map<string, any>();[...nameHits, ...kwHits].forEach(x => map.set(x.id, x));
    this.results = Array.from(map.values());
    //log the results for debugging
    console.log('Search results:', this.results);
    // log nameHits and kwHits separately for debugging
    console.log('Name hits:', nameHits);
    console.log('Keyword hits:', kwHits);
  }
  add(p: any) {
    const ex = this.cart.find((x: any) => x.id === p.id);
    if (ex) {
      this.notification.success('Item already in cart');
      return;
    }
    this.cart.push({ 
      id: p.id, 
      name: p.name,
      brand: p.Brand,
      series: p.Series,
      model: p.Model,
      productId: p.ProductID,
      ram: p.RAM,
      rom: p.ROM,
      qty: 1, 
      sellPrice: p.defaultSellPrice || 0
    });
  }
  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  total() { return this.cart.reduce((s, c) => s + (Number(c.qty || 0) * Number(c.sellPrice || 0)), 0); }

  validateCheckout(): string | null {
    if (!this.customer.name?.trim()) {
      return 'Customer name is required';
    }
    if (!this.customer.phone?.trim()) {
      return 'Customer phone is required';
    }
    if (!this.paymentAmount) {
      return 'Payment amount is required';
    }
    if (!this.cart.length) {
      return 'Cart is empty';
    }
    return null;
  }

  async checkout() {
    const error = this.validateCheckout();
    if (error) {
      this.notification.error(error);
      return;
    }
    
    const currentUser = await new Promise<any>(resolve => {
      const subscription = this.auth.user$.subscribe(user => {
        resolve(user);
        subscription.unsubscribe();
      });
    });

    const items = this.cart.map(c => ({ productId: c.id, qty: +c.qty, sellPrice: +c.sellPrice }));
    const totalAmount = this.total();
    const paidAmount = this.paymentAmount || totalAmount; // If no payment amount specified, treat as full payment
    
    const saleId = await this.sales.createSale({ 
      customer: this.customer, 
      items, 
      type: this.mode,
      paid: paidAmount,
      soldBy: currentUser ? {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email
      } : undefined
    });
    this.router.navigate(['/sales/invoice', saleId]);
  }
}

