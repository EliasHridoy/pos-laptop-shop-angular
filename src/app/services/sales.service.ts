import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp, query, where, getDocs } from '@angular/fire/firestore';
import { CountersService } from './counters.service';
import { NotificationService } from './notification.service';
import { ProductStatus } from '../models/product-status.enum';

interface SaleIdResponse {
  id: string;
  invoiceNo: string;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private db = inject(Firestore);
  private counters = inject(CountersService);
  private notification = inject(NotificationService);
  readonly ProductStatus = ProductStatus; // Make enum available in template

  async createSale(payload: {
    customer?: any,
    items: any[],
    type: 'DIRECT' | 'INSTANT',
    note?: string,
    paid?: number,
    soldBy?: { uid: string, displayName: string | null, email: string | null }
  }) {
    if (!payload.items?.length) throw new Error('No items');
    try {
      const saleId: SaleIdResponse = await runTransaction(this.db, async (tx) => {
        const saleRef = doc(collection(this.db, 'sales'));
        const invoiceCounterRef = this.counters.getInvoiceCounterRef();

        // Perform all reads first
        const [invoiceCounterSnap, ...productSnaps] = await Promise.all([
          tx.get(invoiceCounterRef),
          ...payload.items.map(line => tx.get(doc(this.db, 'products', line.productId)))
        ]);

        // Now perform calculations
        const { invoiceNo, newCounterData } = this.counters.getNewInvoiceNumberAndCounter(invoiceCounterSnap, 'INV');

        const productReads = productSnaps.map((ps, index) => {
          if (!ps.exists()) throw new Error('Product not found');
          const line = payload.items[index];
          return {
            ref: ps.ref,
            data: ps.data() as any,
            qty: Number(line.qty || 0),
            sellPrice: Number(line.sellPrice)
          };
        });

        let subTotal = 0;
        let costTotal = 0;
        const lineItems: any[] = [];
        const stockMovements: any[] = [];

        productReads.forEach(({ ref, data, qty, sellPrice }) => {
          const finalSellPrice = sellPrice ?? data.defaultSellPrice;
          const costPrice = Number(data.CostPrice || 0);

          //log data for debug
          console.log("product data", data);
          

          // Prepare line item
          lineItems.push({
            productId: ref.id,
            name: data.name,
            qty,
            sellPrice: finalSellPrice,
            costPrice,
            description: data.details || ''
          });

          // Prepare stock movement
          stockMovements.push({
            productId: ref.id,
            qty: -qty,
            type: 'SALE',
            refId: saleRef.id
          });

          subTotal += finalSellPrice * qty;
          costTotal += costPrice * qty;
        });

        // Now perform all writes
        tx.set(invoiceCounterRef, newCounterData, { merge: true });

        productReads.forEach(({ ref }) => {
          tx.update(ref, { Status: ProductStatus.Sold });
        });

        stockMovements.forEach((movement) => {
          const smRef = doc(collection(this.db, 'stockMovements'));
          tx.set(smRef, { ...movement, at: serverTimestamp() });
        });

        const sale = {
          invoiceNo,
          type: payload.type,
          items: lineItems,
          subTotal,
          discount: 0,
          total: subTotal,
          paid: payload.paid || subTotal,
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

  async findSaleByInvoice(invoiceNo: string) {
    const q = query(collection(this.db, 'sales'), where('invoiceNo', '==', invoiceNo));
    const snap = await getDocs(q);
    if (snap.empty) {
      return null;
    }
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}
