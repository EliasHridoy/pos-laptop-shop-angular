import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-floating-cart',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgFor],
  template: `
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
                <td><input class="input" type="number" [(ngModel)]="c.qty" min="1" style="width: 60px;" (ngModelChange)="updateCart()" /></td>
                <td><input class="input" type="number" [(ngModel)]="c.sellPrice" min="0" style="width: 80px;" (ngModelChange)="updateCart()" /></td>
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
              <label>Payment Amount
                <input class="input" type="number" [(ngModel)]="paymentAmount" [max]="total()" 
                       (ngModelChange)="onPaymentAmountChange()" (input)="onPaymentAmountChange()"
                       style="width:120px" placeholder="Payment Amount *" required min="0"/>
              </label>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn secondary" (click)="clear.emit()">Clear</button>
            <button class="btn" (click)="checkout.emit({ cart: cart, paymentAmount: paymentAmount, total: total() })">Checkout</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FloatingCartComponent implements OnChanges {
  @Input() cart: any[] = [];
  @Output() cartChange = new EventEmitter<any[]>();
  @Output() clear = new EventEmitter<void>();
  @Output() checkout = new EventEmitter<any>();

  paymentAmount: number = 0;
  isCartMinimized = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cart']) {
      this.updatePaymentAmount();
    }
  }

  total() { 
    return this.cart.reduce((s, c) => s + (Number(c.qty || 0) * Number(c.sellPrice || 0)), 0); 
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    this.cartChange.emit(this.cart);
    this.updatePaymentAmount();
  }

  updateCart() {
    this.cartChange.emit(this.cart);
    this.updatePaymentAmount();
  }

  updatePaymentAmount() {
    this.paymentAmount = this.total();
  }

  onPaymentAmountChange() {
    const total = this.total();
    if (this.paymentAmount > total) {
      this.paymentAmount = total;
    }
    if (this.paymentAmount < 0) {
      this.paymentAmount = 0;
    }
  }
}
