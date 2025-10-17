import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { Timestamp } from 'firebase/firestore';
import { ProductsService } from '../../services/products.service';
import { CatalogService } from '../../services/catalog.service';
import { NgxPaginationModule } from 'ngx-pagination';  // Correct import
import { UploadExcelService, SheetJson } from '../../services/upload-excel.service';
import { ProductStatus } from '../../models/product-status.enum';
import { ExcelData } from '../../models/excel-data.model';
import { StockInModel } from '../../models/stock-in.model';
import { ExcelUploadComponent } from '../../components/excel-upload/excel-upload.component';



@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, DatePipe, NgxPaginationModule, DecimalPipe, ExcelUploadComponent],
  template: `
    <div class="products-page">
      <h2 class="page-title">Products</h2>
      <div class="grid">
      <!-- Product Details View -->
      <div class="card" *ngIf="showDetails">
        <div class="header-actions">
          <h3>Product Details</h3>
          <button class="btn secondary" (click)="closeDetails()">Close</button>
        </div>

        <div class="details-container" *ngIf="selectedProduct">
          <!-- Basic Information -->
          <div class="form-section">
            <h4>Basic Information</h4>
            <div class="details-row">
              <div class="detail-item">
                <label>Serial No:</label>
                <span>{{selectedProduct.No || '-'}}</span>
              </div>
              <div class="detail-item">
                <label>Date Added:</label>
                <span>{{selectedProduct.Date | date}}</span>
              </div>
              <div class="detail-item">
                <label>Item:</label>
                <span>{{selectedProduct.Item}}</span>
              </div>
            </div>
          </div>

          <!-- Category Information -->
          <div class="form-section">
            <h4>Category Details</h4>
            <div class="details-row">
              <div class="detail-item">
                <label>Brand:</label>
                <span>{{selectedProduct.Brand}}</span>
              </div>
              <div class="detail-item">
                <label>Series:</label>
                <span>{{selectedProduct.Series}}</span>
              </div>
            </div>
          </div>

          <!-- Specifications -->
          <div class="form-section">
            <h4>Specifications</h4>
            <div class="details-row">
              <div class="detail-item">
                <label>Model:</label>
                <span>{{selectedProduct.Model}}</span>
              </div>
              <div class="detail-item">
                <label>Processor:</label>
                <span>{{selectedProduct.Processor}}</span>
              </div>
            </div>
            <div class="details-row">
              <div class="detail-item">
                <label>Generation:</label>
                <span>{{selectedProduct.Genaration}}</span>
              </div>
              <div class="detail-item">
                <label>RAM:</label>
                <span>{{selectedProduct.RAM}}</span>
              </div>
              <div class="detail-item">
                <label>ROM:</label>
                <span>{{selectedProduct.ROM}}</span>
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="form-section">
            <h4>Product Details</h4>
            <div class="details-row">
              <div class="detail-item">
                <label>Product ID:</label>
                <span>{{selectedProduct.ProductID}}</span>
              </div>
              <div class="detail-item">
                <label>Cost Price:</label>
                <span>৳{{selectedProduct.CostPrice}}</span>
              </div>
            </div>
            <div class="details-row">
              <div class="detail-item">
                <label>Status:</label>
                <span>{{selectedProduct.Status}}</span>
              </div>
              <div class="detail-item" *ngIf="selectedProduct.Description">
                <label>Description:</label>
                <span>{{selectedProduct.Description}}</span>
              </div>
            </div>
          </div>

          <div class="details-actions">
            <button class="btn" (click)="edit(selectedProduct)">Edit</button>
            <button class="btn danger" (click)="remove(selectedProduct.id)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Product Grid -->
      <div class="card" *ngIf="!showForm && !showDetails">
        <div class="header-actions">
          <h3>Products</h3>
          <button class="btn primary" (click)="showForm = true">Add Product</button>
        </div>

        <div class="filters">
          <div class="search-box">
            <input class="input" placeholder="Search by name/keyword" [(ngModel)]="q" (change)="search()" />
            <button class="btn secondary" (click)="search()">Search</button>
          </div>

          <div class="status-filter">
            <select class="input" [(ngModel)]="selectedStatus" (change)="filterByStatus()">
              <option [ngValue]="null">All Status</option>
              <option *ngFor="let status of statusOptions" [value]="status">{{status}}</option>
            </select>
          </div>
        </div>

        <!-- Status Summary -->
        <div class="status-summary" *ngIf="selectedStatus === ProductStatus.Available">
          <div class="summary-item">
            <span class="label">Available Products:</span>
            <span class="value">{{productCount}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Cost:</span>
            <span class="value">৳{{totalCost | number:'1.2-2'}}</span>
          </div>
        </div>

  <table class="table products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Brand</th>
              <th>Series</th>
              <th>Model</th>
              <th>Product ID</th>
              <th>Cost Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of items | paginate: { itemsPerPage: itemsPerPage, currentPage: currentPage, totalItems: totalItems }">
              <td>{{p.No || '-'}}</td>
              <td>{{p.Item}}</td>
              <td>{{p.Brand}}</td>
              <td>{{p.Series}}</td>
              <td>{{p.Model}}</td>
              <td>{{p.ProductID}}</td>
              <td>৳{{p.CostPrice}}</td>
              <td>
                <span class="status-badge" [class]="getStatusClass(p.Status)">{{p.Status}}</span>
              </td>
              <td class="actions">
                <button class="btn small info" (click)="viewDetails(p)" title="View Details">
                  View
                </button>
                <button class="btn small" (click)="edit(p)" title="Edit Product">
                  Edit
                </button>
                <button class="btn small danger" (click)="remove(p.id)" title="Delete Product">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination-container">
          <div class="page-size-selector">
            <label>Items per page:</label>
            <select class="input" [(ngModel)]="itemsPerPage" (change)="onPageSizeChange()">
              <option *ngFor="let size of pageSizes" [value]="size">{{size}}</option>
            </select>
          </div>
          <pagination-controls (pageChange)="pageChanged($event)"></pagination-controls>
        </div>
      </div>

      <!-- Stock In Form -->
      <div class="card stock-in-card" *ngIf="showForm">
        <div class="header-actions">
          <h3>{{editingId ? 'Edit Product' : 'Stock In Form'}}</h3>
          <button class="btn secondary" (click)="showForm = false">Close</button>
        </div>

        <!-- Add Mode Selection -->
        <div class="add-mode-selector" *ngIf="!editingId">
          <label>
            <input type="radio" name="addMode" value="regular" [(ngModel)]="addMode">
            Regular Add
          </label>
          <label>
            <input type="radio" name="addMode" value="batch" [(ngModel)]="addMode">
            Batch Add from Excel
          </label>
        </div>

        <app-excel-upload *ngIf="addMode === 'batch' && !editingId"></app-excel-upload>

        <form (submit)="save()" class="stock-in-form" *ngIf="addMode === 'regular' || editingId">
          <!-- Basic Information -->
          <div class="form-section">
            <h4>Basic Information</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Serial No.</label>
                <input type="number" class="input" [(ngModel)]="form.No" name="serialNo" placeholder="Enter serial number" />
              </div>
              <div class="form-group">
                <label>Date</label>
                <input type="date" class="input" [(ngModel)]="form.Date" name="date" required />
              </div>
              <div class="form-group">
                <label>Item</label>
                <input class="input" [(ngModel)]="form.Item" value="Laptop" name="item" required />
              </div>
            </div>
          </div>

          <!-- Category Information -->
          <div class="form-section">
            <h4>Category Details</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Brand (Category)</label>
                <select class="input" [(ngModel)]="form.categoryId" name="categoryId" (change)="loadSubs()" required>
                  <option value="">Select Brand</option>
                  <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
                </select>
              </div>
              <div class="form-group" *ngIf="form.categoryId">
                <label>Series (Subcategory)</label>
                <select class="input" [(ngModel)]="form.subcategoryId" name="subcategoryId" (change)="onSubcategoryChange()" required>
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
                <input class="input" [(ngModel)]="form.Model" name="model" required />
              </div>
              <div class="form-group">
                <label>Processor</label>
                <input class="input" [(ngModel)]="form.Processor" name="processor" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Generation</label>
                <input class="input" [(ngModel)]="form.Genaration" name="generation" required />
              </div>
              <div class="form-group">
                <label>RAM</label>
                <input class="input" [(ngModel)]="form.RAM" name="ram" required />
              </div>
              <div class="form-group">
                <label>ROM</label>
                <input class="input" [(ngModel)]="form.ROM" name="rom" required />
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="form-section">
            <h4>Product Details</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Product ID</label>
                <input class="input" [(ngModel)]="form.ProductID" name="productId" required />
              </div>
              <div class="form-group">
                <label>Cost Price</label>
                <input type="number" class="input" [(ngModel)]="form.CostPrice" name="costPrice" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Description</label>
                <textarea class="input" [(ngModel)]="form.Description" name="description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="input" [(ngModel)]="form.Status" name="status" required>
                  <option *ngFor="let status of statusOptions" [value]="status">{{status}}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn primary">{{editingId ? 'Update' : 'Save'}}</button>
            <button type="button" class="btn secondary" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  /* Component-specific styles; global tokens are available in src/styles.css */
  .products-page { padding: 1rem 1.25rem; }
  .page-title { margin: 0 0 1rem; font-size: 1.75rem; font-weight: 600; color: #1f2937; }
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      gap: 0.5rem;
      flex: 1;
    }

    .search-box .input {
      flex: 1;
    }

    .status-filter {
      min-width: 200px;
    }

    .status-summary {
      display: flex;
      gap: 2rem;
      margin: 1rem 0;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .summary-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .summary-item .label {
      font-weight: bold;
      color: #495057;
    }

    .summary-item .value {
      font-size: 1.1rem;
      color: #0d6efd;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .actions button {
      min-width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    fa-icon {
      font-size: 14px;
    }

    .details-container {
      padding: 1rem;
    }

    .details-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-item label {
      font-weight: bold;
      color: #666;
    }

    .detail-item span {
      color: #333;
    }

    .details-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .add-mode-selector {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .add-mode-selector label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .stock-in-form {
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

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .page-size-selector select {
      width: auto;
      min-width: 80px;
    }

    .page-size-selector label {
      color: #666;
      font-size: 0.9rem;
    }

    .stock-in-card { min-width: 0; }

    /* Table enhancements */
    .products-table thead tr { background: #f3f4f6; }
    .products-table th { font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; }
    .products-table td, .products-table th { padding: 0.55rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .products-table tbody tr:hover { background: #f9fafb; }
    .products-table tbody tr:last-child td { border-bottom: none; }

    /* Status badges */
    .status-badge { display: inline-block; padding: 0.25rem 0.55rem; font-size: 0.65rem; line-height: 1; border-radius: 999px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase; }
    .status-badge.available { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .status-badge.sold { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .status-badge.servicing { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .status-badge.return { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    /* Card & form styling tweaks */
    .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.1rem 1.25rem 1.25rem; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02); }
    .card + .card { margin-top: 1.5rem; }
    .header-actions h3 { margin:0; font-size: 1.15rem; font-weight:600; }

    .btn.small { padding: 0.35rem 0.6rem; font-size: 0.65rem; line-height: 1; }
    .btn.info { background:#2563eb; color:#fff; }
    .btn.info:hover { background:#1d4ed8; }

    .stock-in-form .form-group label { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; font-weight:600; color:#555; }
    .stock-in-form .form-group input, .stock-in-form .form-group textarea, .stock-in-form .form-group select { border:1px solid #d1d5db; border-radius:6px; background:#fff; }
    .stock-in-form .form-group input:focus, .stock-in-form .form-group textarea:focus, .stock-in-form .form-group select:focus { outline:none; border-color:#6366f1; box-shadow:0 0 0 1px #6366f1, 0 0 0 2px rgba(99,102,241,.2); }
    .form-section { position: relative; background:#fafafa; border:1px solid #e5e7eb; border-radius:8px; padding:1rem 1rem 0.25rem; }
    .form-section h4 { font-size: .85rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; margin:0 0 .75rem; color:#374151; }
    .form-row { gap: 1rem; }
    textarea.input { resize: vertical; }

    /* Status summary refinement */
    .status-summary { background: linear-gradient(90deg,#f3f4f6,#fff); border:1px solid #e5e7eb; }
    .summary-item .label { font-size: .7rem; text-transform:uppercase; }
    .summary-item .value { font-size: .85rem; font-weight:600; }

    /* Pagination tweaks */
    .pagination-container { gap:1rem; }
    .page-size-selector label { text-transform:uppercase; font-size:.65rem; font-weight:600; }
    .page-size-selector select { border:1px solid #d1d5db; border-radius:6px; padding: 0.25rem .5rem; }

    /* Details panel */
    .details-container { background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; }
    .detail-item label { font-size:.65rem; text-transform:uppercase; letter-spacing:.05em; }
    .detail-item span { font-size:.8rem; }
    .details-actions .btn { font-size:.7rem; }

    .add-mode-selector { background:#f1f5f9; border:1px solid #e2e8f0; }
    .add-mode-selector label { font-size:.75rem; }

    /* Responsive adjustments */
    @media (max-width: 1100px) {
      .products-table th:nth-child(3),
      .products-table td:nth-child(3),
      .products-table th:nth-child(4),
      .products-table td:nth-child(4),
      .products-table th:nth-child(5),
      .products-table td:nth-child(5) { display:none; }
    }
    @media (max-width: 800px) {
      .filters { flex-direction: column; }
      .header-actions { flex-direction: column; gap:.5rem; align-items:flex-start; }
      .products-table th:nth-child(1), .products-table td:nth-child(1) { display:none; }
    }
  `]
})
export class ProductsComponent implements OnInit {
  // Component logic
  private svc = inject(ProductsService);
  readonly ProductStatus = ProductStatus; // Make enum available in template
  private catalog = inject(CatalogService);

  // Status filtering
  selectedStatus: ProductStatus | null = null;
  statusOptions = Object.values(ProductStatus);
  productCount = 0;
  totalCost = 0;
  addMode: 'regular' | 'batch' = 'regular';

  getStatusClass(status: string): string {
    return `status-badge ${status.toLowerCase()}`;
  }

  // Use `any` here to allow binding date string for the input and convert to Timestamp on save
  form: any = {
    No: undefined,
    // Keep string YYYY-MM-DD for binding to <input type="date">; will convert to Timestamp on save
    Date: new Date().toISOString().slice(0, 10) as any,
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
  showForm = false;
  showDetails = false;
  selectedProduct: any = null;
  editingId: string | null = null;
  q = '';
  items: any[] = [];
  paginatedItems: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];

  // Pagination variables
  currentPage = 1;
  itemsPerPage = 10; // Default to 10 items per page
  totalItems = 0;

  // Available page sizes
  readonly pageSizes = [10, 50, 100, 500];

  excelData: SheetJson<ExcelData>[] | null = null;

  constructor() {}

  async ngOnInit() {
    this.categories = await this.catalog.listParentCategories();
    this.totalItems = await this.search();
  }

  async loadSubs() {
    if (!this.form.categoryId) {
      this.subcategories = [];
      this.form.subcategoryId = '';
      this.form.Series = '';
      return;
    }

    // Find selected category to get its name
    const selectedCategory = this.categories.find(cat => cat.id === this.form.categoryId);
    if (selectedCategory) {
      this.form.Brand = selectedCategory.name; // Set the Brand name
    }

    this.subcategories = await this.catalog.listSubcategories(this.form.categoryId);
    this.form.subcategoryId = '';
    this.form.Series = ''; // Reset series when category changes
  }

  // Handle subcategory selection
  onSubcategoryChange() {
    const selectedSubcategory = this.subcategories.find(sub => sub.id === this.form.subcategoryId);
    if (selectedSubcategory) {
      this.form.Series = selectedSubcategory.name; // Set the Series name
    }
  }

  async save() {
    if (!this.form.Item) return;

    // Add prefixes to RAM and ROM if they don't already have them
    if (this.form.RAM && !this.form.RAM.startsWith('RAM')) {
      this.form.RAM = `RAM ${this.form.RAM}`;
    }
    if (this.form.ROM && !this.form.ROM.startsWith('ROM')) {
      this.form.ROM = `ROM ${this.form.ROM}`;
    }

    // Prepare the product data
    const productData = {
      ...this.form,
      name: this.form.Item, // For backwards compatibility and search
      nameLower: this.form.Item.toLowerCase(),
      details: `${this.form.Processor || ''} ${this.form.Genaration || ''} ${this.form.RAM || ''} ${this.form.ROM || ''}`.trim(),
      keywords: [
        this.form.Item,
        this.form.Brand,
        this.form.Series,
        this.form.Model,
        this.form.Processor,
        this.form.Genaration,
        this.form.RAM,
        this.form.ROM
      ].filter((s): s is string => Boolean(s)).map(s => s.toLowerCase())
    };

    // Convert Date string (YYYY-MM-DD) to Firestore Timestamp if needed
    const dateVal = (this.form as any).Date;
    if (typeof dateVal === 'string' && dateVal) {
      // Construct a Date from YYYY-MM-DD
      const d = new Date(dateVal);
      (productData as any).Date = Timestamp.fromDate(d);
    } else if (dateVal instanceof Timestamp) {
      (productData as any).Date = dateVal;
    } else if (dateVal instanceof Date) {
      (productData as any).Date = Timestamp.fromDate(dateVal);
    }

    if (this.editingId) {
      await this.svc.updateProduct(this.editingId, productData);
    } else {
      await this.svc.createProduct(productData);
    }
    this.resetForm();
    this.totalItems = await this.search(); // Re-fetch with pagination
  }

  edit(p: any) {
    this.showForm = true;
    this.showDetails = false;
    this.editingId = p.id;
    // Normalize Date for the form input: if it's a Firestore Timestamp, convert to YYYY-MM-DD string
    const dateVal = (p as any).Date;
    const formCopy: any = { ...p };
    if (dateVal && (dateVal as any).toDate && typeof (dateVal as any).toDate === 'function') {
      const d = (dateVal as any).toDate();
      formCopy.Date = d.toISOString().slice(0, 10);
    } else if (dateVal instanceof Date) {
      formCopy.Date = dateVal.toISOString().slice(0, 10);
    } else if (typeof dateVal === 'string') {
      formCopy.Date = dateVal;
    }
    this.form = formCopy;
  }

  cancelEdit() { this.resetForm(); }

  async remove(id: string) {
    if (confirm('Delete this product?')) {
      await this.svc.deleteProduct(id);
      this.totalItems = await this.search(); // Re-fetch with pagination
    }
  }

  resetForm() {
    this.form = {
      No: undefined,
      Date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format for input[type="date"]
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
    this.editingId = null;
    this.showForm = false;
  }

  viewDetails(product: any) {
    this.selectedProduct = product;
    this.showDetails = true;
  }

  closeDetails() {
    this.selectedProduct = null;
    this.showDetails = false;
  }

  async filterByStatus() {
    if (this.q) {
      // If there's a search query, clear it and reset the search
      this.q = '';
    }

    const result = await this.svc.getProductsByStatus(this.selectedStatus);
    this.items = result.products;
    this.totalItems = result.count;
    this.productCount = result.count;
    this.totalCost = result.totalCost;
    return this.totalItems;
  }

  async search() {
    // Reset status filter when searching
    this.selectedStatus = null;

    const nameHits = await this.svc.searchByName(this.q);
    console.log('Name hits:', nameHits);

    const kwHits = this.q ? await this.svc.searchByKeyword(this.q) : [];
    console.log('Keyword hits:', kwHits);

    const map = new Map<string, any>(); [...nameHits, ...kwHits].forEach(x => map.set(x.id, x));
    this.items = Array.from(map.values());
    this.totalItems = this.items.length;
    this.productCount = this.items.length;
    this.totalCost = this.items.reduce((sum, item) => sum + (Number(item.CostPrice) || 0), 0);
    return this.totalItems;
  }

  pageChanged(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange() {
    this.currentPage = 1; // Reset to first page when changing page size
  }
}
