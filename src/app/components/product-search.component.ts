import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ProductsService } from '../services/products.service';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
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
          <button class="btn secondary" style="width: 100%;" (click)="addProduct.emit(r)">Add to Cart</button>
        </div>
      </div>
    </div>
  `
})
export class ProductSearchComponent {
  private products = inject(ProductsService);
  
  q = ''; 
  results: any[] = [];
  
  @Output() addProduct = new EventEmitter<any>();

  async search() {
    const nameHits = await this.products.searchByName(this.q, true);
    const kwHits = this.q ? await this.products.searchByKeyword(this.q, true) : [];
    const map = new Map<string, any>();
    [...nameHits, ...kwHits].forEach(x => map.set(x.id, x));
    this.results = Array.from(map.values());
    console.log('Search results:', this.results);
    console.log('Name hits:', nameHits);
    console.log('Keyword hits:', kwHits);
  }
}
