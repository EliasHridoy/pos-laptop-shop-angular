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

        // For DIRECT sales, we need to read products from the database
        // For INSTANT sales, products info is already in the items
        let productReads: any[] = [];
        let invoiceCounterSnap;

        if (payload.type === 'DIRECT') {
          // Perform all reads first for direct sales
          const reads = await Promise.all([
            tx.get(invoiceCounterRef),
            ...payload.items.map(line => tx.get(doc(this.db, 'products', line.productId)))
          ]);
          
          invoiceCounterSnap = reads[0];
          const productSnaps = reads.slice(1);

          productReads = productSnaps.map((ps, index) => {
            if (!ps.exists()) throw new Error('Product not found');
            const line = payload.items[index];
            return {
              ref: ps.ref,
              data: line, // Use the item data from frontend (includes description, costPrice, etc.)
              dbData: ps.data() as any, // Keep database data for status updates
              qty: Number(line.qty || 0),
              sellPrice: Number(line.sellPrice),
              isInstant: false
            };
          });
        } else {
          // For INSTANT sales, only read counter
          invoiceCounterSnap = await tx.get(invoiceCounterRef);
          
          // Transform instant items to match the structure
          productReads = payload.items.map((item, index) => ({
            ref: null, // No database reference for instant products
            data: item, // The item already contains all the product info
            dbData: null, // No database data for instant products
            qty: Number(item.qty || 1),
            sellPrice: Number(item.sellPrice),
            isInstant: true
          }));
        }

        // Now perform calculations
        const { invoiceNo, newCounterData } = this.counters.getNewInvoiceNumberAndCounter(invoiceCounterSnap, 'INV');

        let subTotal = 0;
        let costTotal = 0;
        const lineItems: any[] = [];
        const stockMovements: any[] = [];

        productReads.forEach(({ ref, data, dbData, qty, sellPrice, isInstant }) => {
          const finalSellPrice = sellPrice;
          let costPrice: number;
          let productName: string;
          let productDescription: string;
          let productId: string;

          if (isInstant) {
            // For instant products, use the data directly from the cart item
            costPrice = Number(data.costPrice || 0);
            productName = data.name;
            productDescription = data.description;
            productId = data.productId;
          } else {
            // For direct sales, use the item data from frontend
            costPrice = Number(data.costPrice || 0);
            productName = data.name;
            productDescription = data.description;
            productId = data.productId;
            
            console.log("direct sale item data", data);
          }

          // Prepare line item
          lineItems.push({
            productId: productId,
            name: productName,
            qty,
            sellPrice: finalSellPrice,
            costPrice,
            description: productDescription,
            isInstant: isInstant || false
          });

          // Only create stock movements for direct sales (actual products)
          if (!isInstant && ref) {
            stockMovements.push({
              productId: ref.id,
              qty: -qty,
              type: 'SALE',
              refId: saleRef.id
            });
          }

          subTotal += finalSellPrice * qty;
          costTotal += costPrice * qty;
        });

        // Now perform all writes
        tx.set(invoiceCounterRef, newCounterData, { merge: true });

        // Only update product status for direct sales
        if (payload.type === 'DIRECT') {
          productReads.forEach(({ ref, isInstant }) => {
            if (!isInstant && ref) {
              tx.update(ref, { Status: ProductStatus.Sold });
            }
          });
        }

        // Only create stock movements for direct sales
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
          status: 'Active',
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
