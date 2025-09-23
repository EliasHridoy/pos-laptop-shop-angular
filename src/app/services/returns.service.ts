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

  async processReturn(originalSale: any, itemsToReturn: any[], newItems: any[] = []) {
    // Find next return number BEFORE transaction
    const baseInvoiceNo = originalSale.invoiceNo.split(' R')[0];
    const q = query(collection(this.db, 'sales'), where('invoiceNo', '>=', baseInvoiceNo), where('invoiceNo', '<=', baseInvoiceNo + '\uf8ff'));
    const salesSnap = await getDocs(q);
    const returnCount = salesSnap.docs.filter(doc => doc.data()['invoiceNo'].startsWith(baseInvoiceNo) && doc.data()['invoiceNo'].includes(' R')).length + 1;
    const newInvoiceNo = `${baseInvoiceNo} R${returnCount}`;

    try {
        const { newSaleId, returnId } = await runTransaction(this.db, async (tx) => {
            // 1. Update status of returned products to 'Available'
            for (const item of itemsToReturn) {
                if (!item.productId) continue;
                const productRef = doc(this.db, 'products', item.productId);
                tx.update(productRef, { Status: ProductStatus.Available });
            }

            // 2. Update status of new products to 'Sold'
            for (const item of newItems) {
                if (!item.id) continue;
                const productRef = doc(this.db, 'products', item.id);
                tx.update(productRef, { Status: ProductStatus.Sold });
            }

            // 3. Create a new sale document for the items that are NOT returned + new items.
            const keptItems = originalSale.items.filter((item:any) => !itemsToReturn.some(retItem => retItem.productId === item.productId));
            const finalItems = [...keptItems, ...newItems.map(item => ({
                productId: item.id,
                name: item.name,
                description: `${item.brand} ${item.series} ${item.model}`,
                qty: item.qty,
                costPrice: item.price, // Assuming costPrice is same as price for now
                sellPrice: item.sellPrice
            }))];

            // 4. Create a new sale object.
            let subTotal = 0;
            let costTotal = 0;
            
            finalItems.forEach((item:any) => {
                subTotal += item.sellPrice * item.qty;
                costTotal += (item.costPrice || item.sellPrice) * item.qty; // fallback for new items
            });

            const newSalePayload: any = {
                ...originalSale,
                invoiceNo: newInvoiceNo,
                items: finalItems,
                subTotal: subTotal,
                total: subTotal,
                paid: subTotal, // This might need adjustment based on payment
                costTotal: costTotal,
                profit: subTotal - costTotal,
                createdAt: serverTimestamp(),
                originalSaleId: originalSale.id,
                status: 'Active'
            };
            delete newSalePayload.id;

            const newSaleRef = doc(collection(this.db, 'sales'));
            tx.set(newSaleRef, newSalePayload);

            // 5. Update original sale status to indicate it has been returned against.
            const originalSaleRef = doc(this.db, 'sales', originalSale.id);
            tx.update(originalSaleRef, { status: 'Inactive' });

            // 6. Create a 'return' document for auditing.
            const returnRef = doc(collection(this.db, 'returns'));
            const refundAmount = itemsToReturn.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
            const exchangeAmount = newItems.reduce((acc, item) => acc + (item.sellPrice * item.qty), 0);
            
            const returnPayload = {
                originalSaleId: originalSale.id,
                newSaleId: newSaleRef.id,
                returnedItems: itemsToReturn,
                exchangedItems: newItems,
                refundAmount,
                exchangeAmount,
                finalAmount: exchangeAmount - refundAmount, // positive if customer pays more, negative if refund
                createdAt: serverTimestamp()
            };
            tx.set(returnRef, returnPayload);
            
            return { newSaleId: newSaleRef.id, returnId: returnRef.id };
        });
        this.notification.success(`Return processed. New invoice: ${newInvoiceNo}`);
        return newSaleId;
    } catch (error: any) {
        console.error(error);
        this.notification.error(error.message || 'Failed to process return.');
        throw error;
  }
  }
}