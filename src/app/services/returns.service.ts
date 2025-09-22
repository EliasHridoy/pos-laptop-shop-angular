import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, runTransaction, serverTimestamp, query, where, getDocs } from '@angular/fire/firestore';
import { NotificationService } from './notification.service';
import { SalesService } from './sales.service';
import { ProductStatus } from '../models/product-status.enum';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private db = inject(Firestore);
  private notification = inject(NotificationService);
  private salesService = inject(SalesService);

  async processReturn(originalSale: any, itemsToReturn: any[]) {
    // Find next return number BEFORE transaction
    const q = query(collection(this.db, 'sales'), where('invoiceNo', '>=', originalSale.invoiceNo), where('invoiceNo', '<=', originalSale.invoiceNo + '\uf8ff'));
    const salesSnap = await getDocs(q);
    const returnCount = salesSnap.docs.filter(doc => doc.data()['invoiceNo'].includes(' R')).length + 1;
    const newInvoiceNo = `${originalSale.invoiceNo} R${returnCount}`;

    try {
        const { newSaleId, returnId } = await runTransaction(this.db, async (tx) => {
            // 1. Update status of returned products to 'Available'
            for (const item of itemsToReturn) {
                const productRef = doc(this.db, 'products', item.productId);
                tx.update(productRef, { Status: ProductStatus.Available });
            }

            // 2. Create a new sale document for the items that are NOT returned.
            const keptItems = originalSale.items.filter((item:any) => !itemsToReturn.some(retItem => retItem.productId === item.productId));

            // 3. Create a new sale object.
            let subTotal = 0;
            let costTotal = 0;
            
            keptItems.forEach((item:any) => {
                subTotal += item.sellPrice * item.qty;
                costTotal += item.costPrice * item.qty;
            });

            const newSalePayload: any = {
                ...originalSale,
                invoiceNo: newInvoiceNo,
                items: keptItems,
                subTotal: subTotal,
                total: subTotal,
                paid: subTotal,
                costTotal: costTotal,
                profit: subTotal - costTotal,
                createdAt: serverTimestamp(),
                originalSaleId: originalSale.id,
                status: 'COMPLETED'
            };
            delete newSalePayload.id;

            const newSaleRef = doc(collection(this.db, 'sales'));
            tx.set(newSaleRef, newSalePayload);

            // 4. Update original sale status to indicate it has been returned against.
            const originalSaleRef = doc(this.db, 'sales', originalSale.id);
            tx.update(originalSaleRef, { status: 'RETURNED' });

            // 5. Create a 'return' document for auditing.
            const returnRef = doc(collection(this.db, 'returns'));
            const refundTotal = itemsToReturn.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
            const returnPayload = {
                originalSaleId: originalSale.id,
                newSaleId: newSaleRef.id,
                items: itemsToReturn,
                refundTotal: refundTotal,
                createdAt: serverTimestamp()
            };
            tx.set(returnRef, returnPayload);
            
            return { newSaleId: newSaleRef.id, returnId: returnRef.id };
        });
        this.notification.success(`Return processed. New invoice: ${newInvoiceNo}`);
        return newSaleId;
    } catch (error: any) {
        this.notification.error(error.message || 'Failed to process return.');
        throw error;
  }
  }
}
 
