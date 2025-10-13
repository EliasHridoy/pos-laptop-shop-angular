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
    soldBy?: { uid: string, displayName: string | null, email: string | null },
    // Optional: if provided, use this invoiceNo instead of generating a new one via counters
    invoiceNo?: string
  }, silent: boolean = false) {
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
          // If caller supplied invoiceNo, we still need to read products, but we will skip reading the counter later
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
          // For INSTANT sales, only read counter (if needed)
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
        // If caller provided an invoiceNo, use it. Otherwise generate a new one using counters
        let invoiceNo = payload.invoiceNo;
        let newCounterData: any = null;
        if (!invoiceNo) {
          const got = this.counters.getNewInvoiceNumberAndCounter(invoiceCounterSnap, 'INV');
          invoiceNo = got.invoiceNo;
          newCounterData = got.newCounterData;
        }

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
        if (newCounterData) {
          tx.set(invoiceCounterRef, newCounterData, { merge: true });
        }

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

      if (!silent) {
        this.notification.success(`Sale created successfully! Invoice: ${saleId.invoiceNo}`);
      }
      return saleId.id;
    } catch (error: any) {
      this.notification.error(error.message || 'Failed to create sale.');
      throw error;
    }
  }

  async createSalesBulk(payloads: Array<{
    customer?: any,
    items: any[],
    type: 'DIRECT' | 'INSTANT',
    note?: string,
    paid?: number,
    soldBy?: { uid: string, displayName: string | null, email: string | null },
    invoiceNo?: string
  }>) {
    const results: string[] = [];
    for (const payload of payloads) {
      const id = await this.createSale(payload, true); // silent
      results.push(id);
    }
    this.notification.success(`${results.length} sales created successfully!`);
    return results;
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

  /**
   * Update a sale. Payload may include items (full replacement), paid, note, customer, type, status.
   * If items are replaced for a DIRECT sale, this method will attempt to revert stock for the
   * original items and apply stock movements for the new items. It uses a transaction.
   */
  async updateSale(saleId: string, payload: {
    items?: any[],
    paid?: number,
    note?: string,
    customer?: any,
    type?: 'DIRECT' | 'INSTANT',
    status?: string,
    invoiceNo?: string
  }) {
    try {
      await runTransaction(this.db, async (tx) => {
        const saleRef = doc(this.db, 'sales', saleId);
        const saleSnap = await tx.get(saleRef);
        if (!saleSnap.exists()) throw new Error('Sale not found');
        const oldSale = saleSnap.data() as any;

        // If items are provided and sale was DIRECT (or new type is DIRECT), we need to adjust stock
        const oldItems = oldSale.items || [];
        const newItems = payload.items ?? oldItems;
        const oldIsDirect = oldSale.type === 'DIRECT';
        const newIsDirect = (payload.type ?? oldSale.type) === 'DIRECT';

        // Revert stock for old direct items (add back qty)
        if (oldIsDirect && oldItems.length) {
          for (const it of oldItems) {
            // Only process items that look like direct products (have productId)
            if (!it.isInstant && it.productId) {
              const pRef = doc(this.db, 'products', it.productId);
              // set product available again
              try {
                tx.update(pRef, { Status: ProductStatus.Available });
              } catch (e) {
                // ignore individual product update failures to avoid blocking the whole transaction
              }

              const smRef = doc(collection(this.db, 'stockMovements'));
              tx.set(smRef, {
                productId: it.productId,
                qty: Number(it.qty || 0), // add back
                type: 'SALE_REVERSAL',
                refId: saleRef.id,
                at: serverTimestamp()
              });
            }
          }
        }

        // Apply stock for new direct items (subtract qty)
        if (newIsDirect && newItems.length) {
          for (const it of newItems) {
            if (!it.isInstant && it.productId) {
              const pRef = doc(this.db, 'products', it.productId);
              try {
                tx.update(pRef, { Status: ProductStatus.Sold });
              } catch (e) {
                // ignore
              }

              const smRef = doc(collection(this.db, 'stockMovements'));
              tx.set(smRef, {
                productId: it.productId,
                qty: -Number(it.qty || 0), // remove stock
                type: 'SALE',
                refId: saleRef.id,
                at: serverTimestamp()
              });
            }
          }
        }

        // Recompute totals if items changed
        let subTotal = 0;
        let costTotal = 0;
        const lineItems: any[] = [];
        (newItems || []).forEach((it: any) => {
          const qty = Number(it.qty || 0);
          const sellPrice = Number(it.sellPrice || 0);
          const costPrice = Number(it.costPrice || 0);
          lineItems.push({ ...it, qty, sellPrice, costPrice });
          subTotal += sellPrice * qty;
          costTotal += costPrice * qty;
        });

        const updated: any = {};
        if (payload.items) {
          updated.items = lineItems;
          updated.subTotal = subTotal;
          updated.total = subTotal; // leave discount handling to caller
          updated.costTotal = costTotal;
          updated.profit = subTotal - costTotal;
        }
        if (typeof payload.paid !== 'undefined') updated.paid = payload.paid;
        if (typeof payload.note !== 'undefined') updated.note = payload.note;
        if (typeof payload.customer !== 'undefined') updated.customer = payload.customer;
        if (typeof payload.type !== 'undefined') updated.type = payload.type;
        if (typeof payload.status !== 'undefined') updated.status = payload.status;
        if (typeof payload.invoiceNo !== 'undefined') updated.invoiceNo = payload.invoiceNo;
        updated.lastModifiedAt = serverTimestamp();

        tx.update(saleRef, updated);
      });

      this.notification.success('Sale updated successfully');
      return true;
    } catch (error: any) {
      this.notification.error(error.message || 'Failed to update sale.');
      throw error;
    }
  }

  /**
   * Soft-delete a sale: mark status 'Inactive', revert stock for direct sale items and create stock movements adding back quantities.
   */
  async deleteSale(saleId: string) {
    try {
      await runTransaction(this.db, async (tx) => {
        const saleRef = doc(this.db, 'sales', saleId);
        const saleSnap = await tx.get(saleRef);
        if (!saleSnap.exists()) throw new Error('Sale not found');
        const sale = saleSnap.data() as any;

        if (sale.status === 'Inactive') return; // already deleted

        // For direct sales, revert product status and create stock movements that add back qty
        if (sale.type === 'DIRECT' && Array.isArray(sale.items)) {
          for (const it of sale.items) {
            if (!it.isInstant && it.productId) {
              const pRef = doc(this.db, 'products', it.productId);
              try {
                tx.update(pRef, { Status: ProductStatus.Available });
              } catch (e) {
                // ignore per-product failures
              }

              const smRef = doc(collection(this.db, 'stockMovements'));
              tx.set(smRef, {
                productId: it.productId,
                qty: Number(it.qty || 0), // add back
                type: 'SALE_REVERSAL',
                refId: saleRef.id,
                at: serverTimestamp()
              });
            }
          }
        }

        tx.update(saleRef, { status: 'Inactive', deletedAt: serverTimestamp() });
      });

      this.notification.success('Sale deleted and stock reverted');
      return true;
    } catch (error: any) {
      this.notification.error(error.message || 'Failed to delete sale.');
      throw error;
    }
  }
}
