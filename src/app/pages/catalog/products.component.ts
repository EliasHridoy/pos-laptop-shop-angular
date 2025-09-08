import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ProductsService } from '../../services/products.service';
import { CatalogService } from '../../services/catalog.service';
import { NgxPaginationModule } from 'ngx-pagination';  // Correct import

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, NgxPaginationModule],
  template: `
    <h2>Products</h2>
    <div class="grid two">
      <div class="card">
        <h3>{{editingId ? 'Edit Product' : 'Add Product'}}</h3>
        <form (submit)="save()">
          <div class="form-group">
            <label>Name</label>
            <input class="input" [(ngModel)]="form.name" name="name" required />
          </div>
          <div class="form-group">
            <label>SKU</label>
            <input class="input" [(ngModel)]="form.sku" name="sku" required />
          </div>
          <div class="form-group">
            <label>Brand</label>
            <input class="input" [(ngModel)]="form.brand" name="brand" required />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select class="input" [(ngModel)]="form.categoryId" name="categoryId" (change)="loadSubs()" required>
              <option value="">Select Category</option>
              <option *ngFor="let cat of categories" [value]="cat.id">{{cat.name}}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="form.categoryId">
            <label>Subcategory</label>
            <select class="input" [(ngModel)]="form.subcategoryId" name="subcategoryId" required>
              <option value="">Select Subcategory</option>
              <option *ngFor="let sub of subcategories" [value]="sub.id">{{sub.name}}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Cost Price</label>
            <input type="number" class="input" [(ngModel)]="form.costPrice" name="costPrice" required />
          </div>
          <div class="form-group">
            <label>Selling Price</label>
            <input type="number" class="input" [(ngModel)]="form.defaultSellPrice" name="defaultSellPrice" required />
          </div>
          <div class="form-group">
            <label>Stock Quantity</label>
            <input type="number" class="input" [(ngModel)]="form.stockQty" name="stockQty" required />
          </div>
          <div class="form-group">
            <label>Details</label>
            <textarea class="input" [(ngModel)]="form.details" name="details" rows="3"></textarea>
          </div>
          <div class="form-group">
            <button type="submit" class="btn primary">{{editingId ? 'Update' : 'Save'}}</button>
            <button type="button" class="btn secondary" *ngIf="editingId" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Product Grid with Pagination -->
      <div class="card">
        <h3>Products</h3>
        <input class="input" placeholder="Search by name/keyword" [(ngModel)]="q" (keyup.enter)="search()" />
        <button class="btn secondary" (click)="search()">Search</button>

        <table class="table">
          <thead>
            <tr>
              <th>Name</th><th>Brand</th><th>SKU</th><th>Stock</th><th>Price</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of items | paginate: { itemsPerPage: itemsPerPage, currentPage: currentPage, totalItems: totalItems }">
              <td>{{p.name}}</td>
              <td>{{p.brand}}</td>
              <td>{{p.sku}}</td>
              <td>{{p.stockQty}}</td>
              <td>৳{{p.defaultSellPrice}}</td>
              <td>
                <button class="btn small" (click)="edit(p)"> Edit </button>
                <button class="btn small danger" (click)="remove(p.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <pagination-controls
          (pageChange)="pageChanged($event)">
        </pagination-controls>

      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  // Component logic
  private svc = inject(ProductsService);
  private catalog = inject(CatalogService);

  form: any = { name: '', sku: '', brand: '', costPrice: 0, defaultSellPrice: 0, stockQty: 0, details: '', categoryId: null, subcategoryId: null };
  editingId: string | null = null;
  q = '';
  items: any[] = [];
  paginatedItems: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];

  // Pagination variables
  currentPage = 1;
  itemsPerPage = 5; // You can adjust how many items per page
  totalItems = 0;

  async ngOnInit() {
    this.categories = await this.catalog.listCategories(null);
    this.totalItems = await this.search();
  }

  async loadSubs() {
    this.subcategories = this.form.categoryId ? await this.catalog.listCategories(this.form.categoryId) : [];
    this.form.subcategoryId = null;
  }

  async save() {
    if (!this.form.name) return;
    if (this.editingId) {
      await this.svc.updateProduct(this.editingId, this.form);
    } else {
      await this.svc.createProduct(this.form);
    }
    this.resetForm();
    this.totalItems = await this.search(); // Re-fetch with pagination
  }

  edit(p: any) {
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
    this.form = { name: '', sku: '', brand: '', costPrice: 0, defaultSellPrice: 0, stockQty: 0, details: '', categoryId: null, subcategoryId: null };
    this.editingId = null;
  }

  async search() {
    const nameHits = await this.svc.searchByName(this.q);
    console.log('Name hits:', nameHits);

    const kwHits = this.q ? await this.svc.searchByKeyword(this.q) : [];
    console.log('Keyword hits:', kwHits);

    const map = new Map<string, any>(); [...nameHits, ...kwHits].forEach(x => map.set(x.id, x));
    this.items = Array.from(map.values());
    this.totalItems = this.items.length;
    return this.totalItems;
  }

  pageChanged(page: number) {
    this.currentPage = page;
  }
}
