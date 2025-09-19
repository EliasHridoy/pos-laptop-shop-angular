import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ProductsService } from '../../services/products.service';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [DecimalPipe, DatePipe, NgFor, NgIf],
  template: `
    <div class="invoice-container" *ngIf="invoice">
      <div class="invoice-header">
        <h2>Invoice #{{invoice.invoiceNo}}</h2>
        <button (click)="downloadPDF()" class="btn btn-primary">Download PDF</button>
      </div>
      
      <div class="invoice-content">
        <div class="business-details">
          <h3>Laptop Shop</h3>
          <p>123 Tech Street, Digital City</p>
          <p>Phone: +880-1234567890</p>
          <p>Email: emial</p>
        </div>

        <div class="invoice-info">
          <div class="customer-details" *ngIf="invoice.customer">
            <h4>Bill To:</h4>
            <p>{{invoice.customer.name}}</p>
            <p *ngIf="invoice.customer.phone">Phone: {{invoice.customer.phone}}</p>
            <p *ngIf="invoice.customer.address">Address: {{invoice.customer.address}}</p>
          </div>

          <div class="invoice-meta">
            <p>Date: {{invoice.createdAt.toDate() | date:'mediumDate'}}</p>
            <p>Invoice Type: {{invoice.type}}</p>
            <p *ngIf="invoice.note">Note: {{invoice.note}}</p>
          </div>
        </div>
      
        <div class="invoice-items">
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Serial No.</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of invoice.items; let i = index">
                <td>{{i+1}}</td>
                <td>
                  <div class="product-info">
                    <strong>{{item.name}}</strong>
                    <ng-container *ngIf="productDetails.get(item.productId) as product">
                      <div class="specs">
                        <small *ngIf="product.Brand">{{product.Brand}}</small>
                        <small *ngIf="product.Model">Model: {{product.Model}}</small>
                        <small *ngIf="product.Processor">{{product.Processor}} {{product.Genaration}}</small>
                        <small *ngIf="product.RAM || product.ROM">{{product.RAM}} {{product.ROM}}</small>
                        <small *ngIf="product.Description" class="description">{{product.Description}}</small>
                      </div>
                    </ng-container>
                  </div>
                </td>
                <td>{{item.serialNumber || (productDetails.get(item.productId)?.ProductID) || '-'}}</td>
                <td>{{item.qty}}</td>
                <td>৳{{item.sellPrice | number:'1.2-2'}}</td>
                <td>৳{{(item.qty * item.sellPrice) | number:'1.2-2'}}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"></td>
                <td>Subtotal:</td>
                <td>৳{{invoice.subTotal | number:'1.2-2'}}</td>
              </tr>
              <tr *ngIf="invoice.discount > 0">
                <td colspan="4"></td>
                <td>Discount:</td>
                <td>৳{{invoice.discount | number:'1.2-2'}}</td>
              </tr>
              <tr>
                <td colspan="4"></td>
                <td><strong>Total:</strong></td>
                <td><strong>৳{{invoice.total | number:'1.2-2'}}</strong></td>
              </tr>
              <tr>
                <td colspan="4"></td>
                <td>Paid:</td>
                <td>৳{{invoice.paid | number:'1.2-2'}}</td>
              </tr>
              <tr *ngIf="invoice.total - invoice.paid > 0">
                <td colspan="4"></td>
                <td>Due:</td>
                <td>৳{{invoice.total - invoice.paid | number:'1.2-2'}}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="footer">
          <p *ngIf="invoice.soldBy">Served by: {{invoice.soldBy.displayName || invoice.soldBy.email}}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* General Page and Container Styles */
.invoice-container {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    max-width: 800px;
    margin: 40px auto;
    padding: 30px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    color: #333;
    line-height: 1.6;
}

/* Header and Button */
.invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #eee;
    padding-bottom: 20px;
    margin-bottom: 30px;
}

.invoice-header h2 {
    font-size: 2.2em;
    font-weight: 700;
    color: #007bff;
    margin: 0;
}

.btn-primary {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.3s ease;
}

.btn-primary:hover {
    background-color: #0056b3;
}

/* Flexbox Layout for Main Sections */
.invoice-content {
    display: flex;
    flex-direction: column;
}

.business-details {
    margin-bottom: 20px;
}

.business-details h3 {
    font-size: 1.5em;
    font-weight: 600;
    margin-bottom: 5px;
    color: #555;
}

.business-details p {
    margin: 0;
    font-size: 0.9em;
    color: #777;
}

.invoice-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
}

.customer-details, .invoice-meta {
    flex-basis: 48%; /* Adjust for spacing */
}

.customer-details h4 {
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 10px;
    color: #444;
    border-bottom: 2px solid #007bff;
    padding-bottom: 5px;
    display: inline-block;
}

.customer-details p, .invoice-meta p {
    margin: 5px 0;
    font-size: 1em;
}

.invoice-meta {
    text-align: right;
}

/* Table Styles */
.invoice-items {
    margin-bottom: 40px;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.items-table th, .items-table td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}

.items-table th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.9em;
}

.items-table tbody tr:nth-child(even) {
    background-color: #fefefe;
}

.items-table tbody tr:hover {
    background-color: #f1f1f1;
}

.product-info strong {
    color: #333;
    font-weight: 600;
}

.product-info .specs {
    margin-top: 5px;
}

.product-info .specs small {
    display: block;
    color: #666;
    font-size: 0.85em;
}

.items-table tfoot td {
    font-size: 1em;
    font-weight: normal;
    background-color: #f8f9fa;
    text-align: right;
    border-top: 2px solid #ddd;
}

.items-table tfoot td:last-child {
    font-weight: bold;
    color: #007bff;
    border-top: 2px solid #007bff;
}

.items-table tfoot tr:last-child td {
    font-size: 1.2em;
    font-weight: bold;
    background-color: #e9ecef;
    color: #333;
}

/* Footer Section */
.footer {
    text-align: center;
    padding-top: 20px;
    border-top: 2px solid #eee;
    color: #6c757d;
    font-size: 0.9em;
}

.footer p {
    margin: 5px 0;
}
    `]
})
export class InvoiceComponent implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);

  doc!: jsPDF;
  currentY = 20;
  invoice?: Invoice;
  logoBase64: any;
  error?: string;
  loading = true;
  productDetails: Map<string, any> = new Map();

  async ngOnInit() {
    // Get the invoice ID from route parameters
    const saleId = this.route.snapshot.paramMap.get('id');
    if (!saleId) {
      this.error = 'No invoice ID provided';
      this.loading = false;
      return;
    }

    try {
      // Fetch the invoice data from Firestore
      const invoiceRef = doc(this.firestore, 'sales', saleId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        this.error = 'Invoice not found';
        this.loading = false;
        return;
      }

      // Convert the Firestore document to our Invoice type
      this.invoice = {
        id: invoiceSnap.id,
        ...invoiceSnap.data()
      } as Invoice;

      // Fetch product details for each item
      await Promise.all(this.invoice.items.map(async (item) => {
        try {
          const productRef = doc(this.firestore, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            this.productDetails.set(item.productId, productSnap.data());
          }
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
        }
      }));

      // Preload logo when component initializes
      try {
        this.logoBase64 = await this.getImageAsBase64('/assets/images/logo.png');
      } catch (error) {
        console.error('Logo preload failed:', error);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      this.error = 'Failed to load invoice';
    } finally {
      this.loading = false;
    }
  }

  // Helper method to convert image URL to base64
  private getImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS if needed

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };

      img.onerror = (error) => reject(error);
      img.src = url;
    });
  }
  sale: any;
  downloadPDF() {
    this.doc = new jsPDF();
    this.currentY = 20;

    // Add header
    this.addCompanyHeader();

    // Add customer info
    this.addCustomerInfo();

    // Add items table with proper text wrapping
    this.addItemsTable();

    // Add payment details
    this.addPaymentDetails();

    // Add terms and conditions
    this.addTermsAndConditions();

    // Save the PDF
    this.doc.save(`Invoice-${this.sale.invoiceNo}.pdf`);
  }

  private addCompanyHeader() {
    const doc = this.doc;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add logo if available
    if (this.logoBase64) {
      const imgWidth = 35;
      const imgHeight = 25;
      doc.addImage(this.logoBase64, 'PNG', 15, this.currentY, imgWidth, imgHeight);
    }

    // Company name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPTOP CORE TECHNOLOGY', 50, this.currentY);

    // Company details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Shop: 708, Level: 7, F5 Square, Mirpur-10,', 50, this.currentY + 6);
    doc.text('Mirpur TSO, Dhaka-1216, Bangladesh', 50, this.currentY + 10);
    doc.text('Phone: +88 01830 583433', 50, this.currentY + 14);
    doc.text('       +88 01610 974372', 50, this.currentY + 18);

    // Sales Receipt header on right
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const receiptText = 'Sales Receipt';
    const receiptWidth = doc.getTextWidth(receiptText);
    doc.text(receiptText, pageWidth - receiptWidth - 15, this.currentY);

    // Date and invoice number
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateText = `Date: ${new Date().toLocaleDateString('en-GB')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - dateWidth - 15, this.currentY + 6);

    const invoiceText = `Invoice: ${this.sale.invoiceNo}`;
    const invoiceWidth = doc.getTextWidth(invoiceText);
    doc.text(invoiceText, pageWidth - invoiceWidth - 15, this.currentY + 10);

    this.currentY += 35;
  }

  private addCustomerInfo() {
    const doc = this.doc;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Customer info table
    autoTable(doc, {
      startY: this.currentY,
      body: [
        ['Name:', this.sale.customerName || '', 'Phone:', this.sale.customerPhone || ''],
        ['Address:', this.sale.customerAddress || '', 'Email:', '']
      ],
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, fontStyle: 'bold' },
        3: { cellWidth: 60 }
      },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    this.currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  private addItemsTable() {
    const doc = this.doc;

    // Prepare table data
    const tableBody: any[][] = [];

    this.sale.items.forEach((item: any, index: number) => {
      tableBody.push([
        `${index + 1}. ${item.name}`,
        item.serialNumber || 'PC1CWOKC',
        item.description || 'Intel 5-8th gen, 16GB RAM, 256GB SSD',
        item.qty.toString(),
        item.sellPrice.toFixed(2),
        (item.qty * item.sellPrice).toFixed(2)
      ]);
    });

    // Add total row
    const totalAmount = this.sale.items.reduce((sum: number, item: any) =>
      sum + (item.qty * item.sellPrice), 0);

    tableBody.push([
      'TOTAL AMOUNT', '', '', '1', '', totalAmount.toFixed(2)
    ]);

    // Create table with proper text wrapping
    autoTable(doc, {
      startY: this.currentY,
      head: [['Product Name', 'S/N', 'Description', 'Quantity', 'Unit Price\nBDT', 'Value\nBDT']],
      body: tableBody,

      // Key settings to prevent overlapping - Solution 1
      styles: {
        overflow: 'linebreak',      // Enable text wrapping
        cellWidth: 'wrap',          // Auto-adjust cell width
        fontSize: 8,
        cellPadding: 2,
        valign: 'top'              // Align text to top of cell
      },

      // Column-specific settings to control width and prevent overlap
      columnStyles: {
        0: { cellWidth: 45 },       // Product Name - fixed width
        1: { cellWidth: 20 },       // S/N - fixed width  
        2: {
          cellWidth: 55,            // Description - wider, allows wrapping
          overflow: 'linebreak'     // Ensure wrapping for long descriptions
        },
        3: { cellWidth: 18, halign: 'center' }, // Quantity
        4: { cellWidth: 22, halign: 'right' },  // Unit Price
        5: { cellWidth: 25, halign: 'right' }   // Value
      },

      // Header styling
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },

      // Alternating row colors for better readability
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },

      // Table layout settings
      tableWidth: 'auto',
      margin: { left: 15, right: 15 },

      // Ensure table fits on page
      pageBreak: 'auto',

      // Custom styling for total row
      didParseCell: (data) => {
        // Make total row bold
        if (data.section === 'body' && data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      }
    });

    this.currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  private addPaymentDetails() {
    const doc = this.doc;
    const totalAmount = this.sale.items.reduce((sum: number, item: any) =>
      sum + (item.qty * item.sellPrice), 0);

    // Amount in words
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Amount (In Words):', 15, this.currentY);
    doc.text('Twenty eight thousand five hundred taka only', 15, this.currentY + 5);

    this.currentY += 15;

    // Payment details table
    autoTable(doc, {
      startY: this.currentY,
      body: [
        ['Received By:', '', 'Advance:', `BDT ${this.sale.advance.toFixed(2)}`],
        ['Bill Item:', '', 'Paid:', `BDT ${totalAmount.toFixed(2)}`],
        ['1. Backpack', '1', 'Signature:', ''],
        ['2. Adapter', '1', '', ''],
        ['3. Adapter Cable', '1', '', '']
      ],
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' },
        1: { cellWidth: 15 },
        2: { cellWidth: 30, fontStyle: 'bold' },
        3: { cellWidth: 40 }
      },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    this.currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  private addTermsAndConditions() {
    const doc = this.doc;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');

    const terms = [
      '1. This Product is deemed Dead-On-Arrival (DOA) if it is defective upon receipt. This Product has to be returned to the place of purchase within',
      'Fifteen (15) days from date of purchase with original box/receipt/bill.',
      '',
      '2. Battery, Broken seal/Tamper, Liquid damage (Due to Liquid damage), Hardware change [Processor, RAM, Hard disk, Mother board], Pin bending',
      'does not cover Service/Warranty.',
      '',
      '3. Warranty is void if opened/used elsewhere. This Product has to be returned to the place of purchase after taking proper backup. The company is not',
      'held responsible for any data loss/damage during service. Please avoid shock, liquid damage (Water, soft Drink, Coffee, but not limited to).'
    ];

    let currentY = this.currentY;
    terms.forEach(term => {
      doc.text(term, 15, currentY);
      currentY += 3;
    });
  }
}
