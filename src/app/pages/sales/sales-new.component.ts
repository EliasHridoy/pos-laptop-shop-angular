import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { Router } from '@angular/router';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ProductSearchComponent } from '../../components/product-search.component';
import { FloatingCartComponent } from '../../components/floating-cart.component';

@Component({
  selector: 'app-sales-new',
  standalone: true,
  imports: [FormsModule, ProductSearchComponent, FloatingCartComponent],
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
        <app-product-search (addProduct)="add($event)"></app-product-search>
      </div>

      <app-floating-cart 
        [cart]="cart" 
        (cartChange)="cart = $event" 
        (clear)="cart=[]" 
        (checkout)="checkout($event)">
      </app-floating-cart>
    </div>
  `
})
export class SalesNewComponent {
  private sales = inject(SalesService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);

  mode: 'DIRECT' | 'INSTANT' = 'DIRECT';
  customer: any = { name: '', phone: '', email: '', address: '' };
  cart: any[] = [];
  currentUser$ = this.auth.user$;

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

  validateCheckout(paymentAmount: number): string | null {
    if (!this.customer.name?.trim()) {
      return 'Customer name is required';
    }
    if (!this.customer.phone?.trim()) {
      return 'Customer phone is required';
    }
    if (!paymentAmount) {
      return 'Payment amount is required';
    }
    if (!this.cart.length) {
      return 'Cart is empty';
    }
    return null;
  }

  async checkout(data: { cart: any[], paymentAmount: number, total: number }) {
    const error = this.validateCheckout(data.paymentAmount);
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

    const items = data.cart.map(c => ({ productId: c.id, qty: +c.qty, sellPrice: +c.sellPrice }));
    const paidAmount = data.paymentAmount || data.total; // If no payment amount specified, treat as full payment
    
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