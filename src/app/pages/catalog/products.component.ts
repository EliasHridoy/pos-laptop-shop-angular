import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { ProductsService } from '../../services/products.service';
import { CatalogService } from '../../services/catalog.service';
import { NgxPaginationModule } from 'ngx-pagination';  // Correct import
import { UploadExcelService, SheetJson } from '../../services/upload-excel.service';
import { ProductStatus } from '../../models/product-status.enum';
import { ExcelData } from '../../models/excel-data.model';
import { StockInModel } from '../../models/stock-in.model';



@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, DatePipe, NgxPaginationModule, DecimalPipe],
  template: `
    <h2>Products</h2>
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

        <table class="table">
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
              <td>{{p.Status}}</td>
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
      <div class="card" *ngIf="showForm">
        <div class="header-actions">
          <h3>{{editingId ? 'Edit Product' : 'Stock In Form'}}</h3>
          <button class="btn secondary" (click)="showForm = false">Close</button>
        </div>

        <input type="file" accept=".xlsx,.xls" (change)="onFile($event)" />
        
        <!-- Excel Preview Table -->
        <div *ngIf="previewData" class="excel-preview" style="margin: 1rem 0;">
          <h4>Excel Preview (First 100 rows)</h4>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th *ngFor="let header of previewData.headers">{{header}}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of previewData.rows">
                  <td *ngFor="let header of previewData.headers">{{row[header]}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <form (submit)="save()" class="stock-in-form">
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
                  <option [value]="ProductStatus.Available">Available</option>
                  <option [value]="ProductStatus.Sold">Sold</option>
                  <option [value]="ProductStatus.Servicing">Servicing</option>
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

  form: StockInModel = {
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

  data: SheetJson[] | null = null;
  previewData: { headers: (keyof ExcelData)[]; rows: ExcelData[] } | null = null;
  readonly stockHeaders: (keyof ExcelData)[] = [
    'No', 'Date', 'Item', 'Brand', 'Series', 'Model', 'Processor', 
    'Genaration', 'RAM', 'ROM', 'ProductID', 'CostPrice', 'AskingPrice', 
    'Revenue', 'NetRevenue', 'SockOutDate', 'SaleInvoiceNo', 'Status', 'FeedBack'
  ];

  constructor(private excel: UploadExcelService) {}

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
    this.form = { ...p };
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

async onFile(evt: Event) {
  const input = evt.target as HTMLInputElement | null;
  const file = input?.files?.item(0);
  if (!file) return;
  
  const data = await this.excel.readFileToJson(file);
  this.data = data;

  if (data.length > 0) {
    const firstSheet = data[0];
    // Map the raw data to Stock interface
    const excelHeaders = Object.keys(firstSheet.rows[0] || {});
    console.log('Excel Headers:', excelHeaders);

    const rows = firstSheet.rows
      .slice(0, 100) // Take only first 100 rows
      .map(row => {
        const stock: ExcelData = {
          No: Number(row[excelHeaders[0]]) || undefined,
          Date: row[excelHeaders[1]]?.toString(),
          Item: row[excelHeaders[2]]?.toString(),
          Brand: row[excelHeaders[3]]?.toString(),
          Series: row[excelHeaders[4]]?.toString(),
          Model: row[excelHeaders[5]]?.toString(),
          Processor: row[excelHeaders[6]]?.toString(),
          Genaration: row[excelHeaders[7]]?.toString(),
          RAM: row[excelHeaders[8]]?.toString(),
          ROM: row[excelHeaders[9]]?.toString(),
          ProductID: row[excelHeaders[10]]?.toString(),
          CostPrice: Number(row[excelHeaders[11]]) || undefined,
          AskingPrice: Number(row[excelHeaders[12]]) || undefined,
          Revenue: Number(row[excelHeaders[13]]) || undefined,
          NetRevenue: Number(row[excelHeaders[14]]) || undefined,
          SockOutDate: row[excelHeaders[15]]?.toString(),
          SaleInvoiceNo: row[excelHeaders[16]]?.toString(),
          Status: row[excelHeaders[17]]?.toString(),
          FeedBack: row[excelHeaders[18]]?.toString()
        };
        return stock;
      });

    console.log('Mapped Stock Rows:', rows);

    this.previewData = {
      headers: this.stockHeaders,
      rows
    };
  }
}
}
