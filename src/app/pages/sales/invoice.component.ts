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
                      <div class="specs">
                      <small class="formatted-description">{{item.description}}</small>
                    </div>
                  </div>
                </td>
                <td>{{item.productId || 'N/A'}}</td>
                <td>{{item.qty}}</td>
                <td>{{item.sellPrice | number:'1.2-2'}}</td>
                <td>{{(item.qty * item.sellPrice) | number:'1.2-2'}}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4"></td>
                <td>Subtotal:</td>
                <td>{{invoice.subTotal | number:'1.2-2'}}</td>
              </tr>
              <tr *ngIf="invoice.discount > 0">
                <td colspan="4"></td>
                <td>Discount:</td>
                <td>{{invoice.discount | number:'1.2-2'}}</td>
              </tr>
              <tr>
                <td colspan="4"></td>
                <td><strong>Total:</strong></td>
                <td><strong>{{invoice.total | number:'1.2-2'}}</strong></td>
              </tr>
              <tr>
                <td colspan="4"></td>
                <td>Paid:</td>
                <td>{{invoice.paid | number:'1.2-2'}}</td>
              </tr>
              <tr *ngIf="invoice.total - invoice.paid > 0">
                <td colspan="4"></td>
                <td>Due:</td>
                <td>{{invoice.total - invoice.paid | number:'1.2-2'}}</td>
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
    const saleId = this.route.snapshot.paramMap.get('id');
    if (!saleId) {
      this.error = 'No invoice ID provided';
      this.loading = false;
      return;
    }

    try {
      const invoiceRef = doc(this.firestore, 'sales', saleId);
      const invoiceSnap = await getDoc(invoiceRef);

      if (!invoiceSnap.exists()) {
        this.error = 'Invoice not found';
        this.loading = false;
        return;
      }

      this.invoice = {
        id: invoiceSnap.id,
        ...invoiceSnap.data()
      } as Invoice;

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

      try {
        this.logoBase64 = await this.getImageAsBase64('/assets/images/LCT.png');
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

  private getImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
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

  downloadPDF() {
    if (!this.invoice) {
      console.error('Invoice data is not available.');
      return;
    }

    this.doc = new jsPDF();
    this.currentY = 20;

    this.addCompanyHeader();
    this.addCustomerInfo();
    this.addItemsAndFinancialSummaryTable();
    this.addGiftItemsAndSignatures();
    this.addTermsAndConditions();

    // Save the PDF with a dynamic filename
    this.doc.save(`Invoice-${this.invoice.invoiceNo}.pdf`);
  }

  private addCompanyHeader() {
    const doc = this.doc;
    const pageWidth = doc.internal.pageSize.getWidth();

    if (this.logoBase64) {
      const imgWidth = 35;
      const imgHeight = 25;
      doc.addImage(this.logoBase64, 'PNG', 15, this.currentY, imgWidth, imgHeight);
    }

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPTOP CORE TECHNOLOGY', 50, this.currentY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Shop: 708, Level: 7, F5 Square, Mirpur-10,', 50, this.currentY + 6);
    doc.text('Mirpur TSO, Dhaka-1216, Bangladesh', 50, this.currentY + 10);
    doc.text('Phone: +88 01830 583433', 50, this.currentY + 14);
    doc.text('       +88 01610 974372', 50, this.currentY + 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const receiptText = 'Sales Receipt';
    const receiptWidth = doc.getTextWidth(receiptText);
    doc.text(receiptText, pageWidth - receiptWidth - 15, this.currentY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const invoiceDate = this.invoice?.createdAt.toDate().toLocaleDateString('en-GB');
    doc.text(`Date: ${invoiceDate}`, pageWidth - 15, this.currentY + 6, { align: 'right' });
    doc.text(`Invoice: ${this.invoice?.invoiceNo}`, pageWidth - 15, this.currentY + 10, { align: 'right' });

    this.currentY += 35;
  }

  private addCustomerInfo() {
    if (!this.invoice || !this.invoice.customer) return;
    const doc = this.doc;

    autoTable(doc, {
      startY: this.currentY,
      body: [
        ['Name:', this.invoice.customer.name, 'Phone:', this.invoice.customer.phone || 'N/A'],
        ['Address:', this.invoice.customer.address || 'N/A', 'Email:', this.invoice.customer.email || 'N/A']
      ],
      styles: {
        fontSize: 9,
        cellPadding: 3,
        fontStyle: 'normal'
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

private addItemsAndFinancialSummaryTable() {
    if (!this.invoice) return;
    const doc = this.doc;
    const tableBody: any[][] = [];

    // Add invoice items
    this.invoice.items.forEach((item, index) => {
      // Use the stored formatted description from the product or line item
      let descriptionText = item.description || 'N/A';

      tableBody.push([
        `${index + 1}`,
        item.name + (descriptionText ? `\n${descriptionText}` : ''),
        (item.productId || 'N/A'),
        item.qty.toString(),
        `${item.sellPrice.toFixed(2)}`,
        `${(item.qty * item.sellPrice).toFixed(2)}`
      ]);
    });

    // Add financial summary rows using a single cell with colSpan for labels
    const summaryColSpan = 5;
    tableBody.push([
      { content: 'Subtotal:', colSpan: summaryColSpan, styles: { fontStyle: 'bold', halign: 'right' } },
      `${this.invoice.subTotal.toFixed(2)}`
    ]);
    if (this.invoice.discount > 0) {
      tableBody.push([
        { content: 'Discount:', colSpan: summaryColSpan, styles: { fontStyle: 'bold', halign: 'right' } },
        `${this.invoice.discount.toFixed(2)}`
      ]);
    }
    tableBody.push([
      { content: 'Total:', colSpan: summaryColSpan, styles: { fontStyle: 'bold', halign: 'right', fontSize: 12 } },
      { content: `${this.invoice.total.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right', fontSize: 12 } }
    ]);
    tableBody.push([
      { content: 'Paid:', colSpan: summaryColSpan, styles: { fontStyle: 'bold', halign: 'right' } },
      `${this.invoice.paid.toFixed(2)}`
    ]);
    if (this.invoice.total - this.invoice.paid > 0) {
      tableBody.push([
        { content: 'Due:', colSpan: summaryColSpan, styles: { fontStyle: 'bold', halign: 'right' } },
        `${(this.invoice.total - this.invoice.paid).toFixed(2)}`
      ]);
    }
    
    // AutoTable call remains the same
    autoTable(doc, {
      startY: this.currentY,
      head: [['#', 'Item', 'Serial No.', 'Qty', 'Price', 'Total']],
      body: tableBody,
      styles: {
        overflow: 'linebreak',
        fontSize: 8,
        cellPadding: 2,
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      tableWidth: 'auto',
      margin: { left: 15, right: 15 }
    });

    this.currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  private addGiftItemsAndSignatures() {
    const doc = this.doc;
    const giftItems = ['Backpack', 'Mouse', 'Charger'];

    if (giftItems.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Gift Items:', 15, this.currentY);
      
      autoTable(doc, {
        startY: this.currentY + 5,
        head: [['#', 'Item']],
        body: giftItems.map((item, index) => [`${index + 1}.`, item]),
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 50, halign: 'left' }
        },
        margin: { left: 15 }
      });
      this.currentY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      this.currentY += 15;
    }
  
    // Add signature lines
    doc.line(15, this.currentY, 65, this.currentY); // Customer Signature line
    doc.text('Customer Signature', 15, this.currentY + 5);
    
    doc.line(145, this.currentY, 195, this.currentY); // Seller Signature line
    doc.text('Authorized Signature', 145, this.currentY + 5);

    this.currentY += 15;
  }

  private addTermsAndConditions() {
    const doc = this.doc;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 15, this.currentY);

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

    let yPosition = this.currentY + 5;
    doc.setFont('helvetica', 'normal');
    terms.forEach(term => {
      const splitText = doc.splitTextToSize(term, doc.internal.pageSize.getWidth() - 30);
      doc.text(splitText, 15, yPosition);
      yPosition += doc.getTextDimensions(splitText).h + 2;
    });
  }
}