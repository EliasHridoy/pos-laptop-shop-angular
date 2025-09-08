import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common'; 
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, NgFor],
  template: `
    <h2>Categories</h2>
    <div class="grid two">
      <div class="card">
        <h3>Create</h3>
        <label>Name <input class="input" [(ngModel)]="name" /></label>
        <label>Main category
          <select class="input" [(ngModel)]="parentId">
            <option [ngValue]="null">(Top Level)</option>
            <option *ngFor="let m of main" [ngValue]="m.id">{{m.name}}</option>
          </select>
        </label>
        <button class="btn" (click)="create()">Save</button>
      </div>
      <div class="card">
        <h3>Existing</h3>
        <div class="grid two">
          <div>
            <b>Main</b>
            <ul><li *ngFor="let m of main">{{m.name}}</li></ul>
          </div>
          <div>
            <b>Subs (of first)</b>
            <ul><li *ngFor="let s of subs">{{s.name}}</li></ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  private svc = inject(CatalogService);
  name = '';
  parentId: string | null = null; 
  main:any[] = [];
  subs:any[] = [];
  async ngOnInit(){ await this.load(); }

  async load(){
    this.main = await this.svc.listCategories(null);
    const first = this.main[0]?.id || null;
    this.subs = first ? await this.svc.listCategories(first) : [];

    // log main and subs to console
    console.log('Main categories:', this.main);
    console.log('Subcategories of first main category:', this.subs);
  }
  async create(){
    if (!this.name.trim()) return;
    await this.svc.createCategory(this.name, this.parentId);
    this.name=''; this.parentId=null; await this.load();
  }
}
 
