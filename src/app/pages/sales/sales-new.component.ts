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
    <div class="page-container">
      <div class="page-header">
        <h2>New Sale</h2>
        <div class="mode-selector">
          <label class="radio-option">
            <input type="radio" name="mode" value="DIRECT" [(ngModel)]="mode"> 
            <span>Direct Sale</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="mode" value="INSTANT" [(ngModel)]="mode"> 
            <span>Instant Sale</span>
          </label>
        </div>
      </div>

      <div class="main-content">
        <div class="content-grid">
          <div class="customer-section">
            <div class="section-header">
              <h3>Customer Information</h3>
            </div>
            <div class="customer-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Customer Name *</label>
                  <input class="input" [class.error]="!customer.name?.trim()" placeholder="Enter customer name" [(ngModel)]="customer.name" required/>
                </div>
                <div class="form-group">
                  <label>Phone Number *</label>
                  <input class="input" [class.error]="!customer.phone?.trim()" placeholder="Enter phone number" [(ngModel)]="customer.phone" required/>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email Address</label>
                  <input class="input" type="email" placeholder="Enter email (optional)" [(ngModel)]="customer.email" />
                </div>
                <div class="form-group">
                  <label>Address</label>
                  <input class="input" placeholder="Enter address (optional)" [(ngModel)]="customer.address" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="product-section">
            <div class="section-header">
              <h3>Add Products</h3>
            </div>
            <app-product-search (addProduct)="add($event)"></app-product-search>
          </div>
        </div>
      </div>

      <app-floating-cart 
        [cart]="cart" 
        (cartChange)="cart = $event" 
        (clear)="cart=[]" 
        (checkout)="checkout($event)">
      </app-floating-cart>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .page-header h2 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 24px;
      font-weight: 600;
    }

    .mode-selector {
      display: flex;
      gap: 24px;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f9fafb;
      transition: all 0.2s ease;
    }

    .radio-option:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .radio-option:has(input:checked) {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
    }

    .radio-option input {
      margin: 0;
      width: auto;
    }

    .radio-option span {
      font-weight: 500;
    }

    .main-content {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    .customer-section,
    .product-section {
      min-height: 300px;
    }

    .section-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f3f4f6;
    }

    .section-header h3 {
      margin: 0;
      color: #374151;
      font-size: 18px;
      font-weight: 600;
    }

    .customer-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }

    .input {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input.error {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    @media (max-width: 768px) {
      .page-container {
        padding: 16px;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .mode-selector {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
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