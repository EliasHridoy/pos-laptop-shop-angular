import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, orderBy, query } from '@angular/fire/firestore';
import { RouterLink } from '@angular/router';
import { NgFor, DecimalPipe } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [RouterLink, NgFor, NgxPaginationModule, DecimalPipe],
  template: `
    <h2>Sales</h2>
    <div class="card">
      <table class="table">
        <thead><tr><th>Invoice</th><th>Type</th><th>Total</th><th>Profit</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let x of items | paginate: { itemsPerPage: itemsPerPage, currentPage: currentPage,  totalItems: totalItems  }; let i = index">
            <td>{{x.invoiceNo}}</td>
            <td>{{x.type}}</td>
            <td>৳{{x.total | number:'1.2-2'}}</td>
            <td>৳{{x.profit | number:'1.2-2'}}</td>
            <td><a [routerLink]="['/sales/invoice', x.id]">View</a></td>
          </tr>
        </tbody>
      </table>
        <!-- Pagination -->
        <pagination-controls
          (pageChange)="pageChanged($event)">
        </pagination-controls>
    </div>
  `
})
export class SalesListComponent implements OnInit {

  private db = inject(Firestore);
  items:any[] = [];
  // Pagination variables
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  async ngOnInit(){
    const qy = query(collection(this.db, 'sales'), orderBy('createdAt','desc') as any);
    const snap = await getDocs(qy);
    this.items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    console.log(this.items);
    this.totalItems = this.items.length;
  }

    pageChanged(page: number) {
    this.currentPage = page;
  }
}
 
