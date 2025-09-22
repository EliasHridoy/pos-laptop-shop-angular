import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common'; 
import { CatalogService } from '../../services/catalog.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
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
    td button {
        margin-right: 0.5rem;
    }
    .grid.two {
        grid-template-columns: 1fr 2fr;
        gap: 1rem;
    }
  `],
  template: `
    <h2>Categories</h2>
    <div class="grid two">
      <div class="card">
        <h3>{{editingCategoryId ? 'Edit' : 'Create'}} Category</h3>
        <label>Name <input class="input" [(ngModel)]="name" /></label>
        <label>Main category
          <select class="input" [(ngModel)]="parentId">
            <option [ngValue]="null">(Top Level)</option>
            <option *ngFor="let c of availableParents" [ngValue]="c.id">{{c.name}}</option>
          </select>
        </label>
        <button class="btn" (click)="save()">Save</button>
        <button class="btn secondary" *ngIf="editingCategoryId" (click)="cancelEdit()">Cancel</button>
      </div>
      <div class="card">
        <h3>All Categories</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Parent Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cat of categories">
              <td>{{cat.name}}</td>
              <td>{{cat.parentName}}</td>
              <td>
                <button (click)="edit(cat)">Edit</button>
                <button (click)="delete(cat.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  private svc = inject(CatalogService);
  name = '';
  parentId: string | null = null; 
  editingCategoryId: string | null = null;
  categories:any[] = [];

  get availableParents(){
    if(this.editingCategoryId) return this.categories.filter(c=>c.id !== this.editingCategoryId);
    return this.categories;
  }

  async ngOnInit(){
    await this.load();
  }

  async load(){
    this.categories = await this.svc.listCategories();
  }

  async save(){
    if (!this.name.trim()) return;
    if(this.editingCategoryId){
      await this.svc.updateCategory(this.editingCategoryId, {name: this.name, parentId: this.parentId});
    } else {
      await this.svc.createCategory(this.name, this.parentId);
    }
    this.cancelEdit();
    await this.load();
  }

  edit(cat:any){
    this.editingCategoryId = cat.id;
    this.name = cat.name;
    this.parentId = cat.parentId;
  }

  cancelEdit(){
    this.editingCategoryId = null;
    this.name=''; this.parentId=null;
  }

  async delete(id:string){
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await this.svc.deleteCategory(id);
        await this.load();
        Swal.fire(
          'Deleted!',
          'Your category has been deleted.',
          'success'
        );
      } catch (e) {
        // error is already notified by the service.
      }
    }
  }
}
 
