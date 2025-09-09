import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
import { CountersService } from './counters.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private db = inject(Firestore);
  private counters = inject(CountersService);
  private notification = inject(NotificationService);

  async createSale(payload: { 
    customer?: any, 
    items: any[], 
    type: 'DIRECT'|'INSTANT', 
    note?: string, 
    paid?: number,
    soldBy?: { uid: string, displayName: string|null, email: string|null } 
  }) {
    if (!payload.items?.length) throw new Error('No items');
    try {
      const saleId = await runTransaction(this.db, async (tx) => {
      const saleRef = doc(collection(this.db, 'sales'));
      const invoiceNo = await this.counters.nextInvoice('INV');

      let subTotal = 0; let costTotal = 0; const lineItems:any[] = [];

      for (const line of payload.items) {
        const pref = doc(this.db, 'products', line.productId);
        const ps = await tx.get(pref);
        if (!ps.exists()) throw new Error('Product not found');
        const p:any = ps.data();
        const qty = Number(line.qty||0);
        const sellPrice = Number(line.sellPrice ?? p.defaultSellPrice);
        const costPrice = Number(p.costPrice||0);

        let newStock = Number(p.stockQty||0);
        if (payload.type === 'INSTANT' && newStock < qty) {
          const add = qty - newStock;
          newStock += add;
          const smAdd = doc(collection(this.db,'stockMovements'));
          tx.set(smAdd, { productId: pref.id, qty: add, type: 'INSTANT_AUTO_ADD', refId: saleRef.id, at: serverTimestamp() });
        }
        if (payload.type === 'DIRECT' && newStock < qty) {
          throw new Error('Insufficient stock for DIRECT sale');
        }

        newStock -= qty;
        tx.update(pref, { stockQty: newStock });
        const smRef = doc(collection(this.db, 'stockMovements'));
        tx.set(smRef, { productId: pref.id, qty: -qty, type: 'SALE', refId: saleRef.id, at: serverTimestamp() });

        subTotal += sellPrice * qty;
        costTotal += costPrice * qty;
        lineItems.push({ productId: pref.id, name: p.name, qty, sellPrice, costPrice });
      }

      const sale = {
        invoiceNo,
        type: payload.type,
        items: lineItems,
        subTotal,
        discount: 0,
        total: subTotal,
        paid: payload.paid || subTotal, // If no paid amount specified, consider full payment
        costTotal,
        profit: subTotal - costTotal,
        customer: payload.customer || null,
        soldBy: payload.soldBy || null,
        note: payload.note || '',
        status: 'COMPLETED',
        createdAt: serverTimestamp(),
      };
      tx.set(saleRef, sale);
      return { id: saleRef.id, invoiceNo };
    });
    this.notification.success(`Sale created successfully! Invoice: ${saleId.invoiceNo}`);
    return saleId.id;
  } catch (error: any) {
    this.notification.error(error.message || 'Failed to create sale.');
    throw error;
  }
}
}
