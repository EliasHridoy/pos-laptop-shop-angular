import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ProductSearchComponent } from '../../components/product-search.component';
import { FloatingCartComponent } from '../../components/floating-cart.component';
import { CatalogService } from '../../services/catalog.service';
import { StockInModel } from '../../models/stock-in.model';
import { ProductStatus } from '../../models/product-status.enum';

@Component({
  selector: 'app-sales-new',
  standalone: true,
  imports: [FormsModule, ProductSearchComponent, FloatingCartComponent, NgFor, NgIf],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>New Sale</h2>
        <div class="mode-selector">
          <label class="radio-option">
            <input type="radio" name="mode" value="DIRECT" [(ngModel)]="mode" (change)="onModeChange()"> 
            <span>Direct Sale</span>
          </label>
          <label class="radio-option">
            <input type="radio" name="mode" value="INSTANT" [(ngModel)]="mode" (change)="onModeChange()"> 
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
          
          <!-- Direct Sale - Product Search -->
          <div class="product-section" *ngIf="mode === 'DIRECT'">
            <div class="section-header">
              <h3>Add Products</h3>
            </div>
            <app-product-search (addProduct)="add($event)"></app-product-search>
          </div>

          <!-- Instant Sale - Product Form -->
          <div class="product-section" *ngIf="mode === 'INSTANT'">
            <div class="section-header">
              <h3>Product Information</h3>
              <button class="btn primary" (click)="showProductForm = true" *ngIf="!showProductForm">Add Product</button>
            </div>
            
            <div class="instant-product-form" *ngIf="showProductForm">
              <form (submit)="addInstantProduct()" class="product-form">
                <!-- Basic Information -->
                <div class="form-section">
                  <h4>Basic Information</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Item</label>
                      <input class="input" [(ngModel)]="productForm.Item" name="item" value="Laptop" required />
                    </div>
                    <div class="form-group">
                      <label>Product ID</label>
                      <input class="input" [(ngModel)]="productForm.ProductID" name="productId" required />
                    </div>
                  </div>
                </div>

                <!-- Category Information -->
                <div class="form-section">
                  <h4>Category Details</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Brand (Category)</label>
                      <select class="input" [(ngModel)]="productForm.categoryId" name="categoryId" (change)="loadSubs()" required>
                        <option value="">Select Brand</option>
                        <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
                      </select>
                    </div>
                    <div class="form-group" *ngIf="productForm.categoryId">
                      <label>Series (Subcategory)</label>
                      <select class="input" [(ngModel)]="productForm.subcategoryId" name="subcategoryId" (change)="onSubcategoryChange()" required>
                        <option value="">Select Series</option>
                        <option *ngFor="let sub of subcategories" [value]="sub.id">{{sub.name}}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Specifications -->
                <div class="form-section">
                  <h4>Specifications</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Model</label>
                      <input class="input" [(ngModel)]="productForm.Model" name="model" required />
                    </div>
                    <div class="form-group">
                      <label>Processor</label>
                      <input class="input" [(ngModel)]="productForm.Processor" name="processor" required />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Generation</label>
                      <input class="input" [(ngModel)]="productForm.Genaration" name="generation" required />
                    </div>
                    <div class="form-group">
                      <label>RAM</label>
                      <input class="input" [(ngModel)]="productForm.RAM" name="ram" required />
                    </div>
                    <div class="form-group">
                      <label>ROM</label>
                      <input class="input" [(ngModel)]="productForm.ROM" name="rom" required />
                    </div>
                  </div>
                </div>

                <!-- Product Details -->
                <div class="form-section">
                  <h4>Product Details</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Cost Price</label>
                      <input type="number" class="input" [(ngModel)]="productForm.CostPrice" name="costPrice" required />
                    </div>
                    <div class="form-group">
                      <label>Sell Price</label>
                      <input type="number" class="input" [(ngModel)]="sellPrice" name="sellPrice" required />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Description</label>
                      <textarea class="input" [(ngModel)]="productForm.Description" name="description" rows="2"></textarea>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn primary">Add to Cart</button>
                  <button type="button" class="btn secondary" (click)="cancelProductForm()">Cancel</button>
                </div>
              </form>
            </div>
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

    .product-form {
      max-width: 100%;
      padding: 1rem;
    }

    .form-section {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-section h4 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f3f4f6;
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
export class SalesNewComponent implements OnInit {
  private sales = inject(SalesService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private notification = inject(NotificationService);
  private catalog = inject(CatalogService);

  mode: 'DIRECT' | 'INSTANT' = 'DIRECT';
  customer: any = { name: '', phone: '', email: '', address: '' };
  cart: any[] = [];
  currentUser$ = this.auth.user$;

  // Instant sale form properties
  showProductForm = false;
  sellPrice = 0;
  categories: any[] = [];
  subcategories: any[] = [];
  
  productForm: StockInModel = {
    Item: 'Laptop',
    Brand: '',
    categoryId: '',
    Series: '',
    subcategoryId: '',
    Model: '',
    Processor: '',
    Genaration: '',
    RAM: '',
    ROM: '',
    ProductID: '',
    CostPrice: 0,
    Description: '',
    Status: ProductStatus.Available
  };

  async ngOnInit() {
    this.categories = await this.catalog.listParentCategories();
  }

  onModeChange() {
    // Clear cart when switching modes
    this.cart = [];
    this.showProductForm = false;
    this.resetProductForm();
  }

  async loadSubs() {
    if (!this.productForm.categoryId) {
      this.subcategories = [];
      return;
    }

    // Find selected category to get its name
    const selectedCategory = this.categories.find(cat => cat.id === this.productForm.categoryId);
    if (selectedCategory) {
      this.productForm.Brand = selectedCategory.name;
    }

    this.subcategories = await this.catalog.listSubcategories(this.productForm.categoryId);
    this.productForm.subcategoryId = '';
    this.productForm.Series = ''; // Reset series when category changes
  }

  onSubcategoryChange() {
    const selectedSubcategory = this.subcategories.find(sub => sub.id === this.productForm.subcategoryId);
    if (selectedSubcategory) {
      this.productForm.Series = selectedSubcategory.name;
    }
  }

  addInstantProduct() {
    if (!this.validateProductForm()) {
      return;
    }

    // Generate a unique temporary ID for instant products
    const tempId = 'instant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create product name/description for cart display
    const productName = `${this.productForm.Brand} ${this.productForm.Series} ${this.productForm.Model}`;
    
    const cartItem = {
      id: tempId,
      isInstant: true,
      name: productName,
      brand: this.productForm.Brand,
      series: this.productForm.Series,
      model: this.productForm.Model,
      productId: this.productForm.ProductID,
      processor: this.productForm.Processor,
      generation: this.productForm.Genaration,
      ram: this.productForm.RAM,
      rom: this.productForm.ROM,
      costPrice: this.productForm.CostPrice,
      description: this.productForm.Description,
      qty: 1,
      sellPrice: this.sellPrice
    };

    this.cart.push(cartItem);
    this.notification.success('Product added to cart');
    this.resetProductForm();
    this.showProductForm = false;
  }

  validateProductForm(): boolean {
    if (!this.productForm.Item?.trim()) {
      this.notification.error('Item is required');
      return false;
    }
    if (!this.productForm.ProductID?.trim()) {
      this.notification.error('Product ID is required');
      return false;
    }
    if (!this.productForm.categoryId) {
      this.notification.error('Brand is required');
      return false;
    }
    if (!this.productForm.subcategoryId) {
      this.notification.error('Series is required');
      return false;
    }
    if (!this.productForm.Model?.trim()) {
      this.notification.error('Model is required');
      return false;
    }
    if (!this.productForm.Processor?.trim()) {
      this.notification.error('Processor is required');
      return false;
    }
    if (!this.productForm.Genaration?.trim()) {
      this.notification.error('Generation is required');
      return false;
    }
    if (!this.productForm.RAM?.trim()) {
      this.notification.error('RAM is required');
      return false;
    }
    if (!this.productForm.ROM?.trim()) {
      this.notification.error('ROM is required');
      return false;
    }
    if (!this.productForm.CostPrice || this.productForm.CostPrice <= 0) {
      this.notification.error('Valid cost price is required');
      return false;
    }
    if (!this.sellPrice || this.sellPrice <= 0) {
      this.notification.error('Valid sell price is required');
      return false;
    }
    return true;
  }

  resetProductForm() {
    this.productForm = {
      Item: 'Laptop',
      Brand: '',
      categoryId: '',
      Series: '',
      subcategoryId: '',
      Model: '',
      Processor: '',
      Genaration: '',
      RAM: '',
      ROM: '',
      ProductID: '',
      CostPrice: 0,
      Description: '',
      Status: ProductStatus.Available
    };
    this.sellPrice = 0;
    this.subcategories = [];
  }

  cancelProductForm() {
    this.resetProductForm();
    this.showProductForm = false;
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

    let items: any[];
    
    if (this.mode === 'DIRECT') {
      // For direct sales, map to the expected format for existing products
      items = data.cart.map(c => ({ 
        productId: c.id, 
        qty: +c.qty, 
        sellPrice: +c.sellPrice 
      }));
    } else {
      // For instant sales, pass the full product information
      items = data.cart.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        series: c.series,
        model: c.model,
        productId: c.productId,
        processor: c.processor,
        generation: c.generation,
        ram: c.ram,
        rom: c.rom,
        costPrice: c.costPrice,
        description: c.description,
        qty: +c.qty,
        sellPrice: +c.sellPrice
      }));
    }

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