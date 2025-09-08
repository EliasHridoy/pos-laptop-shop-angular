import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);

  async createPurchase(payload: { supplierName?: string, items: { productId: string, qty: number, costPrice: number }[] }) {
    try {
      const id = await runTransaction(this.db, async (tx) => {
        const ref = doc(collection(this.db,'purchases'));
        let total = 0;
        for (const it of payload.items) {
          const pref = doc(this.db, 'products', it.productId);
          const ps = await tx.get(pref);
          if (!ps.exists()) throw new Error('Product not found');
          const p:any = ps.data();
          const newStock = Number(p.stockQty||0) + Number(it.qty||0);
          tx.update(pref, { stockQty: newStock, costPrice: Number(it.costPrice||p.costPrice||0) });
          const smRef = doc(collection(this.db,'stockMovements'));
          tx.set(smRef, { productId: pref.id, qty: it.qty, type: 'PURCHASE', refId: ref.id, at: serverTimestamp() });
          total += Number(it.qty||0) * Number(it.costPrice||0);
        }
        tx.set(ref, { supplierName: payload.supplierName||null, items: payload.items, total, createdAt: serverTimestamp() });
        return ref.id;
      });
      this.notification.success('Purchase created successfully!');
      return id;
    } catch (error: any) {
      this.notification.error(error.message || 'Failed to create purchase.');
      throw error;
    }
  }
}
 
