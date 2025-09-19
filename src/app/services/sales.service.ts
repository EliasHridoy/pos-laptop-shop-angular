import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp } from '@angular/fire/firestore';
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
        const invoiceNo = await this.counters.nextInvoice('INV');

        // First, perform all reads
        const productReads = await Promise.all(
          payload.items.map(async (line) => {
            const pref = doc(this.db, 'products', line.productId);
            const ps = await tx.get(pref);
            if (!ps.exists()) throw new Error('Product not found');
            return {
              ref: pref,
              data: ps.data() as any,
              qty: Number(line.qty || 0),
              sellPrice: Number(line.sellPrice)
            };
          })
        );

        // Calculate totals and prepare line items
        let subTotal = 0;
        let costTotal = 0;
        const lineItems: any[] = [];
        const stockMovements: any[] = [];

        productReads.forEach(({ ref, data, qty, sellPrice }) => {
          const finalSellPrice = sellPrice ?? data.defaultSellPrice;
          const costPrice = Number(data.CostPrice || 0);

          // Prepare line item
          lineItems.push({
            productId: ref.id,
            name: data.name,
            qty,
            sellPrice: finalSellPrice,
            costPrice
          });

          // Prepare stock movement
          stockMovements.push({
            productId: ref.id,
            qty: -qty,
            type: 'SALE',
            refId: saleRef.id
          });

          // Calculate totals
          subTotal += finalSellPrice * qty;
          costTotal += costPrice * qty;
        });

        // Now perform all writes
        productReads.forEach(({ ref }) => {
          tx.update(ref, { Status: ProductStatus.Sold });
        });

        // Create stock movements
        stockMovements.forEach((movement) => {
          const smRef = doc(collection(this.db, 'stockMovements'));
          tx.set(smRef, { ...movement, at: serverTimestamp() });
        });

        // Create sale document
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
}
