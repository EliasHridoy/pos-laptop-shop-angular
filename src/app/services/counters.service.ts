import { Injectable, inject } from '@angular/core';
import { Firestore, doc, runTransaction, serverTimestamp, DocumentSnapshot } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CountersService {
  private db = inject(Firestore);

  getInvoiceCounterRef() {
    return doc(this.db, 'counters', 'invoices');
  }

  async nextInvoice(prefix = 'INV') {
    const ref = this.getInvoiceCounterRef();
    const id = await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      return this.calculateNextInvoiceNumber(tx, ref, snap, prefix);
    });
    return id;
  }

  calculateNextInvoiceNumber(tx: any, ref: any, snap: any, prefix = 'INV') {
    const { invoiceNo, newCounterData } = this.getNewInvoiceNumberAndCounter(snap, prefix);
    tx.set(ref, newCounterData, { merge: true });
    return invoiceNo;
  }

  getNewInvoiceNumberAndCounter(snap: DocumentSnapshot, prefix = 'INV'): { invoiceNo: string, newCounterData: any } {
    const dt = new Date();
    const ymd = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
    let seq = 1;
    let lastDate = ymd;
    if (snap.exists()) {
      const d: any = snap.data();
      lastDate = d.lastDate || ymd;
      seq = (lastDate === ymd ? (d.seq || 0) + 1 : 1);
    }
    const newCounterData = { lastDate: ymd, seq, updatedAt: serverTimestamp() };
    const invoiceNo = `${prefix}-${ymd}-${String(seq).padStart(4, '0')}`;
    return { invoiceNo, newCounterData };
  }
}
