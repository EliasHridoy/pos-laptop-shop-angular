import { Injectable, inject } from '@angular/core';
import { Firestore, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CountersService {
  private db = inject(Firestore);

  async nextInvoice(prefix='INV') {
    const ref = doc(this.db, 'counters', 'invoices');
    const id = await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(ref);
      const dt = new Date();
      const ymd = `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}`;
      let seq = 1; let lastDate = ymd;
      if (snap.exists()) {
        const d:any = snap.data();
        lastDate = d.lastDate || ymd;
        seq = (lastDate === ymd ? (d.seq||0)+1 : 1);
      }
      tx.set(ref, { lastDate: ymd, seq, updatedAt: serverTimestamp() }, { merge: true });
      return `${prefix}-${ymd}-${String(seq).padStart(4,'0')}`;
    });
    return id;
  }
}
 
