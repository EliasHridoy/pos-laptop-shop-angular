import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReturnsService } from '../../services/returns.service';
import { SalesService } from '../../services/sales.service';
import { NgFor, NgIf, DatePipe, CurrencyPipe } from '@angular/common';
import { ProductSearchComponent } from '../../components/product-search.component';
import { FloatingCartComponent } from '../../components/floating-cart.component';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, DatePipe, CurrencyPipe, ProductSearchComponent, FloatingCartComponent],
  styles: [`
    :host {
      display: block;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      border: 1px solid var(--border-color, #ddd);
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background-color: var(--table-header-bg, #f2f2f2);
    }
    tr:nth-child(even) {
      background-color: var(--table-even-row-bg, #f9f9f9);
    }
    .grid.two {
        grid-template-columns: 1fr 2fr;
        gap: 1rem;
    }
    .grid.four {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
    }
  `],
  template: `
    <h2>Sales Return</h2>
    <div class="card">
      <div class="grid two" style="align-items: end;">
        <label>Invoice Number
          <input class="input" placeholder="Invoice Number" [(ngModel)]="invoiceNo" (keydown.enter)="searchSale()" />
        </label>
        <button class="btn" (click)="searchSale()">Search</button>
      </div>

      <div *ngIf="sale">
        <h3>Sale Details</h3>
        <div class="grid four">
            <p><strong>Invoice:</strong> {{sale.invoiceNo}}</p>
            <p><strong>Date:</strong> {{sale.createdAt.toDate() | date:'short'}}</p>
            <p><strong>Total:</strong> {{sale.total | currency}}</p>
            <p><strong>Profit:</strong> {{sale.profit | currency}}</p>
        </div>

        <h4>Items to Return</h4>
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" (change)="toggleAllItems($event)"></th>
              <th>Product</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sale.items">
              <td><input type="checkbox" [(ngModel)]="item.isReturned"></td>
              <td>{{item.name}}</td>
              <td>{{item.description}}</td>
              <td>{{item.qty}}</td>
              <td>{{item.sellPrice | currency}}</td>
            </tr>
          </tbody>
        </table>
        <button class="btn" (click)="processReturnAndExchange()" [disabled]="itemsToReturn.length === 0 && cart.length === 0">Process Return & Exchange</button>
        
        <hr>

        <app-product-search (addProduct)="addToCart($event)"></app-product-search>
        <app-floating-cart 
            [cart]="cart" 
            (cartChange)="cart = $event" 
            (clear)="clearCart()" 
            (checkout)="processReturnAndExchange()">
        </app-floating-cart>

      </div>
      <div *ngIf="searchPerformed && !sale">
        <p>No sale found with that invoice number.</p>
      </div>
    </div>
  `
})
export class ReturnsComponent {
  private returnsSvc = inject(ReturnsService);
  private salesSvc = inject(SalesService);

  invoiceNo = '';
  sale: any = null;
  searchPerformed = false;
  cart: any[] = [];
  
  get itemsToReturn() {
      return this.sale ? this.sale.items.filter((i:any) => i.isReturned) : [];
  }

  async searchSale() {
    if (!this.invoiceNo.trim()) return;
    this.searchPerformed = true;
    this.sale = await this.salesSvc.findSaleByInvoice(this.invoiceNo.trim());
    if (this.sale) {
      this.sale.items.forEach((item:any) => item.isReturned = false);
    }
  }

  toggleAllItems(event: any) {
    const checked = event.target.checked;
    if (this.sale) {
      this.sale.items.forEach((item:any) => item.isReturned = checked);
    }
  }

  addToCart(product: any) {
    const existing = this.cart.find(x => x.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ 
        id: product.id, 
        name: product.name,
        brand: product.Brand,
        series: product.Series,
        model: product.Model,
        productId: product.ProductID,
        ram: product.RAM,
        rom: product.ROM,
        qty: 1, 
        price: product.price || 0,
        sellPrice: product.price || 0
      });
    }
  }

  clearCart() {
    this.cart = [];
  }

  async processReturnAndExchange() {
    if (!this.sale) return;

    const returnedItems = this.itemsToReturn;
    const newItems = this.cart;

    if (returnedItems.length === 0 && newItems.length === 0) return;

    await this.returnsSvc.processReturn(this.sale, returnedItems, newItems);
    
    this.invoiceNo = '';
    this.sale = null;
    this.searchPerformed = false;
    this.cart = [];
  }
}
 
