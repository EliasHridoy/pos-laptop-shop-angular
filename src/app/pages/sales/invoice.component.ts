import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DecimalPipe, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [DecimalPipe, NgIf, NgFor],
  template: `
    <h2>Invoice</h2>
    <div class="card" *ngIf="sale">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div><b>Invoice:</b> {{sale.invoiceNo}}</div>
          <div class="muted">Type: {{sale.type}}</div>
        </div>
        <button class="btn secondary" (click)="downloadPDF()">Download PDF</button>
      </div>
      <table class="table" style="margin-top:8px;">
        <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Price</th><th>Line</th></tr></thead>
        <tbody>
          <tr *ngFor="let it of sale.items; let i=index">
            <td>{{i+1}}</td>
            <td>{{it.name}}</td>
            <td>{{it.qty}}</td>
            <td>৳{{it.sellPrice | number:'1.2-2'}}</td>
            <td>৳{{(it.qty * it.sellPrice) | number:'1.2-2'}}</td>
          </tr>
        </tbody>
      </table>
      <div style="text-align:right; font-weight:bold;">Total: ৳{{sale.total | number:'1.2-2'}}</div>
    </div>
  `
})
export class InvoiceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private db = inject(Firestore);
  sale:any = null;
  async ngOnInit(){
    const id = this.route.snapshot.paramMap.get('id')!;
    const snap = await getDoc(doc(this.db, 'sales', id));
    if (snap.exists()) this.sale = { id: snap.id, ...(snap.data() as any) };
  }
  
  // PDF generation
  downloadPDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Company Header Section
  this.addCompanyHeader(doc, pageWidth);
  
  // Invoice Details Section  
  this.addInvoiceDetails(doc, pageWidth);
  
  // Customer Information Section
  this.addCustomerInfo(doc);
  
  // Items Table
  this.addItemsTable(doc);
  
  // Terms and Conditions
  this.addTermsAndConditions(doc, pageHeight);
  
  // Save the PDF
  doc.save(`Invoice-${this.sale.invoiceNo}.pdf`);
}

private addCompanyHeader(doc: jsPDF, pageWidth: number) {
  // Logo placeholder - you can replace this with actual logo
  doc.setFillColor(200, 200, 200); // Light gray placeholder
  doc.rect(15, 10, 30, 20, 'F'); // Rectangle as logo placeholder
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('LOGO', 28, 21); // Placeholder text
  
  // Company name and details
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('YOUR COMPANY NAME', 50, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Shop: 708, Level: 7, F5 Square, Mirpur-10,', 50, 26);
  doc.text('Mirpur TSO, Dhaka-1216, Bangladesh', 50, 30);
  doc.text('Phone: +88 01830 583433', 50, 34);
  doc.text('       +88 01610 974372', 50, 38);
  
  // Sales Receipt header on right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const receiptText = 'Sales Receipt';
  const receiptWidth = doc.getTextWidth(receiptText);
  doc.text(receiptText, pageWidth - receiptWidth - 15, 20);
  
  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateText = `Date: ${new Date().toLocaleDateString('en-GB')}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - dateWidth - 15, 26);
  
  // Invoice number on right
  const invoiceText = `Invoice: ${this.sale.invoiceNo || '1261'}`;
  const invoiceWidth = doc.getTextWidth(invoiceText);
  doc.text(invoiceText, pageWidth - invoiceWidth - 15, 30);
}

private addInvoiceDetails(doc: jsPDF, pageWidth: number) {
  // Draw border around invoice details
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(15, 45, pageWidth - 30, 25);
  
  // Customer details section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', 20, 52);
  doc.text('Phone:', 120, 52);
  
  doc.setFont('helvetica', 'normal');
  doc.text(this.sale.customerName || 'Mr. Customer Name', 35, 52);
  doc.text(this.sale.customerPhone || '+8801XXXXXXXXX', 135, 52);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 20, 58);
  doc.text('Email:', 120, 58);
  
  doc.setFont('helvetica', 'normal');
  doc.text(this.sale.customerAddress || 'Customer Address, Dhaka, Bangladesh', 35, 58);
  doc.text(this.sale.customerEmail || '', 135, 58);
}

private addCustomerInfo(doc: jsPDF) {
  const startY = 75;
  
  // Table header with borders
  doc.setFillColor(240, 240, 240);
  doc.rect(15, startY, 180, 8, 'F');
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(15, startY, 180, 8);
  
  // Header text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Product Name', 17, startY + 5);
  doc.text('S/N', 70, startY + 5);
  doc.text('Description', 90, startY + 5);
  doc.text('Quantity', 130, startY + 5);
  doc.text('Unit Price', 150, startY + 5);
  doc.text('Value', 175, startY + 5);
  
  // Add vertical lines for columns
  const columnPositions = [15, 65, 85, 125, 145, 165, 195];
  columnPositions.forEach(x => {
    doc.line(x, startY, x, startY + 8);
  });
}

private addItemsTable(doc: jsPDF) {
  const startY = 88;
  let currentY = startY;
  
  // Items data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  this.sale.items.forEach((item: any, index: number) => {
    const rowHeight = 15;
    
    // Draw row borders
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(15, currentY, 180, rowHeight);
    
    // Add vertical lines
    const columnPositions = [15, 65, 85, 125, 145, 165, 195];
    columnPositions.forEach(x => {
      doc.line(x, currentY, x, currentY + rowHeight);
    });
    
    // Item details
    doc.text(`${index + 1}. ${item.name}`, 17, currentY + 5);
    doc.text(item.serialNumber || 'PC1CWOKC', 67, currentY + 5);
    doc.text(item.description || `Intel 5-8th gen, 16GB RAM, 256GB SSD`, 87, currentY + 5);
    doc.text(item.qty.toString(), 132, currentY + 5);
    doc.text(`BDT ${item.sellPrice.toFixed(2)}`, 147, currentY + 5);
    doc.text(`BDT ${(item.qty * item.sellPrice).toFixed(2)}`, 167, currentY + 5);
    
    currentY += rowHeight;
  });
  
  // Total row
  const totalRowY = currentY;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, totalRowY, 180, 10, 'F');
  doc.rect(15, totalRowY, 180, 10);
  
  // Vertical lines for total row
  const columnPositions = [15, 65, 85, 125, 145, 165, 195];
  columnPositions.forEach(x => {
    doc.line(x, totalRowY, x, totalRowY + 10);
  });
  
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT', 17, totalRowY + 6);
  doc.text('1', 132, totalRowY + 6);
  doc.text(`BDT ${this.sale.total.toFixed(2)}`, 167, totalRowY + 6);
  
  // Amount in words
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Total Amount (In Words):', 17, totalRowY + 15);
  doc.text(this.numberToWords(this.sale.total) + ' taka only', 17, totalRowY + 20);
  
  this.addPaymentDetails(doc, totalRowY + 25);
}

private addPaymentDetails(doc: jsPDF, startY: number) {
  // Payment details section
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(15, startY, 90, 25);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Received By:', 17, startY + 5);
  doc.text('Bill Item:', 17, startY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('1. Backpack', 35, startY + 15);
  doc.text('2. Adapter', 35, startY + 18);
  doc.text('3. Adapter Cable', 35, startY + 21);
  
  // Right side payment info
  doc.rect(105, startY, 90, 25);
  doc.setFont('helvetica', 'bold');
  doc.text('Advance:', 142, startY + 5);
  doc.text('Paid:', 142, startY + 10);
  doc.text('Signature:', 142, startY + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`BDT ${this.sale.advance || '0.00'}`, 165, startY + 5);
  doc.text(`BDT ${this.sale.total.toFixed(2)}`, 165, startY + 10);
}

private addTermsAndConditions(doc: jsPDF, pageHeight: number) {
  const termsY = pageHeight - 40;
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const terms = [
    '1. This Product is deemed Dead-On-Arrival (DOA) if it is defective upon receipt. This Product has to be returned to the place of purchase within',
    'Fifteen (15) days from date of purchase with original box/receipt/bill.',
    '2. Battery, Broken seal/Tamper, Liquid damage (Due to Liquid damage), Hardware change [Processor, RAM, Hard disk, Mother board], Pin bending',
    'does not cover Service/Warranty.',
    '3. Warranty is void if opened/used elsewhere. This Product has to be returned to the place of purchase after taking proper backup. The company is not',
    'held responsible for any data loss/damage during service. Please avoid shock, liquid damage (Water, soft Drink, Coffee, but not limited to).'
  ];
  
  let currentY = termsY;
  terms.forEach(term => {
    doc.text(term, 15, currentY);
    currentY += 3;
  });
}

// Helper method to convert numbers to words (basic implementation)
private numberToWords(num: number): string {
  // This is a simplified version - you may want to use a more comprehensive library
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + this.numberToWords(num % 100) : '');
  
  return 'Twenty eight thousand five hundred'; // Fallback for demo
}

}
 
