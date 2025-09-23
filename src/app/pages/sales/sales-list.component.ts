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
    <div class="sales-list-container">
      <div class="page-header">
        <h2>Sales List</h2>
      </div>
      
      <div class="main-content">
        <div class="search-section">
          <input class="input search-input" placeholder="Search by Invoice, Customer, Phone or Product" [(ngModel)]="searchQuery" (keyup)="search()"/>
          <button class="btn search-btn" (click)="search()">Search</button>
        </div>
        
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let x of filteredItems | paginate: { itemsPerPage: itemsPerPage, currentPage: currentPage, totalItems: totalItems }; let i = index">
                <td>{{x.invoiceNo}}</td>
                <td>{{x.customer?.name}} <br/><small class="muted">{{x.customer?.phone}}</small></td>
                <td>{{x.type}}</td>
                <td>
                  <span class="status-badge" [class.active]="x.status === 'Active'" [class.inactive]="x.status === 'Inactive'">
                    {{x.status || 'Active'}}
                  </span>
                </td>
                <td>৳{{x.total | number:'1.2-2'}}</td>
                <td>৳{{x.paid | number:'1.2-2'}}</td>
                <td>৳{{x.total - (x.paid || 0) | number:'1.2-2'}}</td>
                <td>
                  <div class="actions">
                    <a [routerLink]="['/sales/invoice', x.id]" class="view-link">View</a>
                    <button *ngIf="x.total > (x.paid || 0) && x.status !== 'Inactive'" class="btn secondary pay-btn" (click)="openPaymentModal(x)">Pay Due</button>
                    <span *ngIf="x.status === 'Inactive'" class="inactive-text">No actions available</span>
                  </div>
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
    </div>
  `,
  styles: [`
    .sales-list-container {
      padding: 20px;
      max-width: 1400px;
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
      margin: 0;
      color: #111827;
      font-size: 24px;
      font-weight: 600;
    }

    .main-content {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .search-section {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      margin-bottom: 24px;
    }

    .search-input {
      min-width: 300px;
    }

    .search-btn {
      white-space: nowrap;
    }

    .table-container {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .table th,
    .table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }

    .table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .table tr:hover {
      background-color: #f9fafb;
    }

    .status-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.inactive {
      background: #fee2e2;
      color: #dc2626;
    }

    .actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .view-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .view-link:hover {
      text-decoration: underline;
    }

    .pay-btn {
      font-size: 12px;
      padding: 6px 12px;
    }

    .inactive-text {
      color: #6b7280;
      font-size: 12px;
      font-style: italic;
    }

    .muted {
      color: #6b7280;
      font-size: 12px;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #fff;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .modal-content h3 {
      margin-top: 0;
      color: #111827;
    }

    @media (max-width: 768px) {
      .sales-list-container {
        padding: 16px;
      }

      .search-section {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .table {
        font-size: 14px;
      }

      .table th,
      .table td {
        padding: 8px;
      }

      .actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
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
 
