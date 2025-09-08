import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import { CountersService } from './counters.service';

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private db = inject(Firestore);
  private counters = inject(CountersService);

  async createServiceOrder(payload: { saleId?: string|null, productId: string, issue: string, charges: number, status?: string }) {
    const id = await runTransaction(this.db, async (tx) => {
      const ref = doc(collection(this.db, 'services'));
      const invoiceNo = await this.counters.nextInvoice('SRV');
      tx.set(ref, { saleId: payload.saleId||null, productId: payload.productId, issue: payload.issue, charges: Number(payload.charges||0), status: payload.status||'RECEIVED', invoiceNo, createdAt: serverTimestamp() });
      return ref.id;
    });
    return id;
  }
}
 
