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
  downloadPDF(){
    const docx = new jsPDF();
    docx.setFontSize(14); docx.text(`Invoice: ${this.sale.invoiceNo}`, 14, 16);
    docx.setFontSize(10); docx.text(`Type: ${this.sale.type}`, 14, 22);
    const rows = this.sale.items.map((it:any,i:number)=>[i+1, it.name, it.qty, it.sellPrice.toFixed(2), (it.qty*it.sellPrice).toFixed(2)]);
    autoTable(docx, { startY: 28, head: [['#','Item','Qty','Price','Line']], body: rows });
    const y = (docx as any).lastAutoTable.finalY + 10;
    docx.text(`Total: ৳${this.sale.total.toFixed(2)}`, 14, y);
    docx.save(`${this.sale.invoiceNo}.pdf`);
  }
}
 
