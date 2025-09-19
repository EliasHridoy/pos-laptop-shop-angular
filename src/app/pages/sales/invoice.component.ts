import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DecimalPipe, NgFor } from '@angular/common';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [DecimalPipe, NgFor],
  template: `
    <div class="invoice-container">
      <div class="invoice-header">
        <h2>Invoice Details</h2>
        <button (click)="downloadPDF()" class="btn btn-primary">Download PDF</button>
      </div>
      
      <!-- Your existing template content -->
      <div class="invoice-preview">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let it of sale.items; let i = index">
              <td>{{i+1}}</td>
              <td>{{it.name}}</td>
              <td>{{it.qty}}</td>
              <td>৳{{it.sellPrice | number:'1.2-2'}}</td>
              <td>৳{{(it.qty * it.sellPrice) | number:'1.2-2'}}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class InvoiceComponent implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  
  doc!: jsPDF;
  currentY = 20;
  
  sale: any = {
    invoiceNo: '1261',
    customerName: 'Mr. Nahidul Islam',
    customerPhone: '+8801672569397',
    customerAddress: 'Bashundhara R/A, Dhaka, Bangladesh',
    advance: 0,
    items: [
      {
        name: 'Lenovo Thinkpad T490L',
        serialNumber: 'PC1CWOKC',
        description: 'Intel 5-8th gen, 16GB RAM, 256GB SSD with extended warranty and professional software suite including Microsoft Office',
        qty: 1,
        sellPrice: 28500.00
      }
    ]
  };
  logoBase64: any;

  async ngOnInit() {
    // Preload logo when component initializes
    try {
      this.logoBase64 = await this.getImageAsBase64('https://your-domain.com/logo.png');
    } catch (error) {
      console.error('Logo preload failed:', error);
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
