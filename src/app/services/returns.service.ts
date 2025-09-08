import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);
  async createSalesReturn(payload: { saleId: string, items: any[] }) {
    try {
      const retId = await runTransaction(this.db, async (tx) => {
        const saleRef = doc(this.db, 'sales', payload.saleId);
        const saleSnap = await tx.get(saleRef);
        if (!saleSnap.exists()) throw new Error('Sale not found');

        const returnRef = doc(collection(this.db,'returns'));
        let refundTotal = 0;
        for (const it of payload.items) {
          const pref = doc(this.db, 'products', it.productId);
          const ps = await tx.get(pref);
          if (!ps.exists()) throw new Error('Product missing');
          const qty = Number(it.qty||0);
          const price = Number(it.sellPrice||0);
          const newStock = Number((ps.data() as any).stockQty||0) + qty;
          tx.update(pref, { stockQty: newStock });
          const smRef = doc(collection(this.db,'stockMovements'));
          tx.set(smRef, { productId: pref.id, qty, type: 'SALES_RETURN', refId: returnRef.id, at: serverTimestamp() });
          refundTotal += price * qty;
        }
        tx.set(returnRef, { saleId: payload.saleId, items: payload.items, refundTotal, createdAt: serverTimestamp() });
        return { id: returnRef.id, refundTotal };
      });
      this.notification.success(`Return created successfully! Refund amount: ${retId.refundTotal}`);
      return retId.id;
    } catch (error: any) {
      this.notification.error(error.message || 'Failed to create return.');
      throw error;
    }
  }
}
 
