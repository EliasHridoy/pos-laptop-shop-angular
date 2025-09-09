import { Component, inject, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, orderBy, query, doc, setDoc, updateDoc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { RouterLink } from '@angular/router';
import { NgFor, DecimalPipe, NgIf } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [RouterLink, NgFor, NgxPaginationModule, DecimalPipe, FormsModule, NgIf],
  template: `
    <h2>Sales</h2>
    <div class="card">
      <div class="grid two" style="margin-bottom: 16px;">
        <input class="input" placeholder="Search by Invoice, Customer, Phone or Product" [(ngModel)]="searchQuery" (keyup)="search()"/>
        <button class="btn" (click)="search()">Search</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Due</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let x of filteredItems | paginate: { itemsPerPage: itemsPerPage, currentPage: currentPage, totalItems: totalItems }; let i = index">
            <td>{{x.invoiceNo}}</td>
            <td>{{x.customer?.name}} <br/><small class="muted">{{x.customer?.phone}}</small></td>
            <td>{{x.type}}</td>
            <td>৳{{x.total | number:'1.2-2'}}</td>
            <td>৳{{x.paid | number:'1.2-2'}}</td>
            <td>৳{{x.total - (x.paid || 0) | number:'1.2-2'}}</td>
            <td>
              <a [routerLink]="['/sales/invoice', x.id]">View</a>
              <button *ngIf="x.total > (x.paid || 0)" class="btn secondary" (click)="openPaymentModal(x)">Pay Due</button>
            </td>
          </tr>
        </tbody>
      </table>
        <!-- Pagination -->
        <pagination-controls
          (pageChange)="pageChanged($event)">
        </pagination-controls>
    </div>

    <!-- Payment Modal -->
    <div *ngIf="showPaymentModal" class="modal">
      <div class="modal-content">
        <h3>Process Payment</h3>
        <p>Invoice: {{selectedSale?.invoiceNo}}</p>
        <p>Customer: {{selectedSale?.customer?.name}}</p>
        <p>Total Amount: ৳{{selectedSale?.total | number:'1.2-2'}}</p>
        <p>Already Paid: ৳{{selectedSale?.paid | number:'1.2-2'}}</p>
        <p>Remaining Due: ৳{{(selectedSale?.total || 0) - (selectedSale?.paid || 0) | number:'1.2-2'}}</p>
        
        <div style="margin: 16px 0;">
          <label>Payment Amount:</label>
          <input class="input" type="number" [(ngModel)]="paymentAmount" 
                 [max]="(selectedSale?.total || 0) - (selectedSale?.paid || 0)"
                 style="width:150px"/>
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="btn secondary" (click)="showPaymentModal = false">Cancel</button>
          <button class="btn" (click)="processPayment()">Process Payment</button>
        </div>
      </div>
    </div>
  `
})
export class SalesListComponent implements OnInit {
  private db = inject(Firestore);
  
  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery = '';
  
  // Pagination variables
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;
  
  // Payment modal
  showPaymentModal = false;
  selectedSale: any = null;
  paymentAmount = 0;

  async ngOnInit() {
    const qy = query(collection(this.db, 'sales'), orderBy('createdAt', 'desc') as any);
    const snap = await getDocs(qy);
    this.items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    this.filteredItems = [...this.items];
    this.totalItems = this.items.length;
  }

  search() {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredItems = this.items.filter(item => 
        item.invoiceNo?.toLowerCase().includes(query) ||
        item.customer?.name?.toLowerCase().includes(query) ||
        item.customer?.phone?.includes(query) ||
        item.items?.some((i: any) => i.name?.toLowerCase().includes(query))
      );
    }
    this.totalItems = this.filteredItems.length;
    this.currentPage = 1;
  }

  openPaymentModal(sale: any) {
    this.selectedSale = sale;
    this.paymentAmount = sale.total - (sale.paid || 0);
    this.showPaymentModal = true;
  }

  async processPayment() {
    if (!this.selectedSale || !this.paymentAmount) return;
    
    try {
      const saleRef = doc(this.db, 'sales', this.selectedSale.id);
      const currentPaid = this.selectedSale.paid || 0;
      
      // Create payment record
      const paymentRef = doc(collection(this.db, 'payments'));
      await setDoc(paymentRef, {
        saleId: this.selectedSale.id,
        amount: this.paymentAmount,
        date: serverTimestamp(),
        type: 'DUE_PAYMENT'
      });

      // Update sale record
      await updateDoc(saleRef, {
        paid: currentPaid + this.paymentAmount,
        lastPaymentDate: serverTimestamp()
      });

      // Refresh the data
      const updatedSaleSnap = await getDoc(saleRef);
      const index = this.items.findIndex(i => i.id === this.selectedSale.id);
      if (index !== -1) {
        this.items[index] = { id: updatedSaleSnap.id, ...(updatedSaleSnap.data() as any) };
        this.search(); // Refresh filtered items
      }

      this.showPaymentModal = false;
      this.selectedSale = null;
      this.paymentAmount = 0;
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      // Add error notification here
    }
  }

  pageChanged(page: number) {
    this.currentPage = page;
  }
}
 
