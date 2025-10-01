import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common'; 
import { IconComponent } from '../../components/icon/icon.component';
import { CatalogService } from '../../services/catalog.service';
import Swal from 'sweetalert2';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, IconComponent],
  styles: [`
    /* Component-specific styles; global tokens are available in src/styles.css */
    .grid.two {
      display: grid;
      grid-template-columns: 360px 1fr; /* left form column + right list */
      gap: 1rem;
      align-items: start;
    }

    /* Card tweaks for the form & list */
    .card { padding: 1rem; }
    .card h3 { margin: 0 0 .75rem; font-size: 1.05rem; color: #111827; }

    /* Form layout inside left column */
    label { display: block; margin-bottom: 0.25rem; font-weight: 600; color: #374151; }
    .form-row { display: flex; flex-direction: column; gap: .25rem; margin-bottom: .75rem; }
    .form-row .input, .card select { width: 100%; }

    .form-actions { display:flex; gap:.5rem; margin-top:.5rem; align-items: center; }
    .form-actions .btn svg { margin-right: .4rem; vertical-align: middle; }

    /* Table/list styles */
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border: 1px solid #e6e9ee; padding: .6rem; text-align: left; }
    th { background-color: #f8fafb; font-weight: 600; }
    tr:nth-child(even) { background-color: #fbfdff; }

    td button { margin-right: 0.5rem; }

    /* Actions column: compact icon buttons */
    td.actions { display:flex; gap:.4rem; align-items:center; }
    .btn.icon { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; padding:0; border-radius:6px; }
    .btn.icon svg { width:16px; height:16px; }
    .btn.icon.danger { color: var(--danger); border: 1px solid rgba(220,38,38,0.12); }

    /* Small screen adjustments */
    @media (max-width: 768px) {
      .grid.two { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; }
      .btn.icon { width:34px; height:34px; }
    }
  `],
  template: `
    <h2>Categories</h2>
    <div class="grid two">
      <div class="card">
        <h3>{{editingCategoryId ? 'Edit' : 'Create'}} Category</h3>

        <div class="form-row">
          <label for="cat-name">Name</label>
          <input id="cat-name" class="input" [(ngModel)]="name" />
        </div>

        <div class="form-row">
          <label for="cat-parent">Main category</label>
          <select id="cat-parent" class="input" [(ngModel)]="parentId">
            <option [ngValue]="null">(Top Level)</option>
            <option *ngFor="let c of availableParents" [ngValue]="c.id">{{c.name}}</option>
          </select>
        </div>

        <div class="form-actions">
          <button class="btn btn.primary" (click)="save()" title="Save category">
            <app-icon name="save" [size]="16" [strokeWidth]="1.5"></app-icon>
            <span>Save</span>
          </button>

          <button class="btn btn.secondary" *ngIf="editingCategoryId" (click)="cancelEdit()" title="Cancel">Cancel</button>
        </div>
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
              <td class="actions">
                <button class="btn icon" (click)="edit(cat)" [attr.aria-label]="'Edit ' + cat.name" title="Edit">
                  <app-icon name="edit" [size]="16" [strokeWidth]="1"></app-icon>
                </button>

                <button class="btn icon btn.danger" (click)="delete(cat.id)" [attr.aria-label]="'Delete ' + cat.name" title="Delete">
                  <app-icon name="delete" [size]="16" [strokeWidth]="1.25"></app-icon>
                </button>
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
  private notify = inject(NotificationService);
  name = '';
  parentId: string | null = null; 
  editingCategoryId: string | null = null;
  categories:any[] = [];

  get availableParents(){
    const parentCategories = this.categories.filter(c => c.parentId === null);
    if(this.editingCategoryId) return parentCategories.filter(c=>c.id !== this.editingCategoryId);
    return parentCategories;
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

    if (!result.isConfirmed) return; 
    try {
      await this.svc.deleteCategory(id);
      await this.load();
      this.notify.success('Category deleted successfully');
    } catch (e:any) {
      this.notify.error(e?.message || 'Failed to delete category');
    }
  }
}
 
